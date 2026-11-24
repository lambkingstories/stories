package __PACKAGE__

import android.app.Activity
import com.google.android.play.core.assetpacks.AssetPackManager
import com.google.android.play.core.assetpacks.AssetPackManagerFactory
import com.google.android.play.core.assetpacks.model.AssetPackStatus
import java.io.File
import java.io.InputStream
import java.io.OutputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * The media of the adventures (pictures, sounds) are not inside the app but in Play Asset Delivery packs:
 *  - "lkcore" (fast-follow): the shared pictures (games used by several adventures), the medals and cards of all adventures, the sentinel picture.
 *    Google downloads it right after the installation.
 *  - "adv_<id>" (on-demand), one per adventure: its pictures and sounds. The app asks for it (/__fetch) when the child opens the adventure.
 * None of them counts for the size of the app in the Play Store.
 *
 * A pack is a folder of real files in the private storage of the app. The WebView of Tauri cannot read such files with seeking (Tauri issue 12243),
 * so a tiny web server on the phone itself (127.0.0.1, only reachable from this phone) hands them out, with correct "Range" answers for the sounds.
 *
 *   GET /__status[?pack=adv_x]  -> {"status":"ready|downloading|pending|waiting_wifi|failed|none|error","percent":0..100,"detail":"..."}   (no pack: lkcore)
 *   GET /__fetch?pack=adv_x     -> asks Google to download the pack (same answer as /__status)
 *   GET /<path>                 -> the file (images/abenteuer/..., audio/abenteuer/...) from the pack it lives in
 *
 * Written once, started by MainActivity (scripts/patch-android-assetpack.mjs puts it into the generated project and fills in the adventure ids).
 */
object LkMedia {
    private const val CORE = "lkcore"
    private val IDS: Set<String> = setOf(__IDS__)
    private val PORTS = intArrayOf(47321, 47322, 47323)

    private class Pack(val name: String) {
        @Volatile var status = "none"
        @Volatile var detail = ""
        @Volatile var percent = 0
        @Volatile var root: File? = null
        @Volatile var asked = false
    }

    private val packs = ConcurrentHashMap<String, Pack>()
    @Volatile private var started = false
    private var manager: AssetPackManager? = null
    private var activityRef: java.lang.ref.WeakReference<Activity>? = null
    private val pool = Executors.newCachedThreadPool()
    private val pathPattern = Regex("^/(?:images|audio)/abenteuer/(?:spiele/)?([^/]+)/")

    private fun pack(name: String): Pack = packs.getOrPut(name) { Pack(name) }

    private fun packNameOfId(id: String) = "adv_" + id.replace('-', '_')

    /** True for lkcore and for the pack of a known adventure. */
    private fun isKnownPack(name: String): Boolean = name == CORE || IDS.any { packNameOfId(it) == name }

    /** The pack a file lives in: the one of its adventure, or lkcore. */
    private fun packOf(path: String): String {
        val m = pathPattern.find(path) ?: return CORE
        val id = m.groupValues[1]
        return if (id in IDS) packNameOfId(id) else CORE
    }

    fun start(activity: Activity) {
        if (started) return
        started = true
        activityRef = java.lang.ref.WeakReference(activity)
        try {
            manager = AssetPackManagerFactory.getInstance(activity.applicationContext)
        } catch (e: Throwable) {
            pack(CORE).status = "error"
            pack(CORE).detail = "Play Asset Delivery nicht verfuegbar: " + e.message
        }
        refresh(pack(CORE), false)
        pool.execute { serve() }
    }

    /** Looks where a pack is (cheap; called with every status request); `fetch` also asks Google to download it when it is not there. */
    private fun refresh(p: Pack, fetch: Boolean) {
        val m = manager ?: return
        try {
            val path = m.getPackLocation(p.name)?.assetsPath()
            if (path != null) {
                p.root = File(path)
                p.status = "ready"
                p.percent = 100
                return
            }
            val wanted = fetch || p.name == CORE
            if (wanted && p.status != "downloading") {
                try { m.fetch(listOf(p.name)) } catch (e: Throwable) { p.detail = "fetch: " + e.message }
            }
            m.getPackStates(listOf(p.name)).addOnSuccessListener { states ->
                val s = states.packStates()[p.name] ?: return@addOnSuccessListener
                val total = s.totalBytesToDownload()
                p.percent = if (total > 0) ((s.bytesDownloaded() * 100) / total).toInt() else 0
                when (s.status()) {
                    AssetPackStatus.COMPLETED -> p.status = if (p.root != null) "ready" else "pending"
                    AssetPackStatus.DOWNLOADING, AssetPackStatus.TRANSFERRING -> p.status = "downloading"
                    AssetPackStatus.PENDING -> p.status = "pending"
                    AssetPackStatus.WAITING_FOR_WIFI, AssetPackStatus.REQUIRES_USER_CONFIRMATION -> {
                        p.status = "waiting_wifi"
                        askForCellular(p)
                    }
                    AssetPackStatus.FAILED, AssetPackStatus.CANCELED -> {
                        p.status = "failed"
                        p.detail = "Fehlercode " + s.errorCode()
                    }
                    AssetPackStatus.NOT_INSTALLED -> p.status = if (wanted) "pending" else "none"
                    else -> p.status = "pending"
                }
            }.addOnFailureListener { e ->
                p.status = "error"
                p.detail = "getPackStates: " + e.message
            }
        } catch (e: Throwable) {
            p.status = "error"
            p.detail = "refresh: " + e.message
        }
    }

    private fun askForCellular(p: Pack) {
        if (p.asked) return
        p.asked = true
        val a = activityRef?.get() ?: return
        try {
            a.runOnUiThread { try { manager?.showCellularDataConfirmation(a) } catch (ignored: Throwable) {} }
        } catch (ignored: Throwable) {}
    }

    private fun serve() {
        var server: ServerSocket? = null
        for (p in PORTS) {
            try {
                server = ServerSocket(p, 50, InetAddress.getByName("127.0.0.1"))
                break
            } catch (ignored: Throwable) {}
        }
        val srv = server ?: run {
            pack(CORE).status = "error"
            pack(CORE).detail = "kein freier Anschluss"
            return
        }
        while (true) {
            val sock = try { srv.accept() } catch (ignored: Throwable) { return }
            pool.execute { try { handle(sock) } catch (ignored: Throwable) {} finally { try { sock.close() } catch (ignored: Throwable) {} } }
        }
    }

    private fun query(target: String, key: String): String? {
        val q = target.substringAfter('?', "")
        for (kv in q.split('&')) {
            if (kv.substringBefore('=') == key) {
                return try { URLDecoder.decode(kv.substringAfter('=', ""), "UTF-8") } catch (ignored: Throwable) { null }
            }
        }
        return null
    }

    private fun handle(sock: Socket) {
        sock.soTimeout = 15000
        val input = sock.getInputStream().buffered()
        val out = sock.getOutputStream()
        val requestLine = readLine(input) ?: return
        val headers = HashMap<String, String>()
        while (true) {
            val l = readLine(input) ?: break
            if (l.isEmpty()) break
            val i = l.indexOf(':')
            if (i > 0) headers[l.substring(0, i).trim().lowercase()] = l.substring(i + 1).trim()
        }
        val parts = requestLine.split(' ')
        if (parts.size < 2) return
        val method = parts[0]
        var path = parts[1].substringBefore('?')
        if (method == "OPTIONS") { write(out, 204, "No Content", emptyMap(), null, 0, false); return }
        if (method != "GET" && method != "HEAD") { write(out, 405, "Method Not Allowed", emptyMap(), null, 0, false); return }
        path = try { URLDecoder.decode(path.replace("+", "%2B"), "UTF-8") } catch (ignored: Throwable) { path }
        if (path == "/__status" || path == "/__fetch") {
            val name = query(parts[1], "pack") ?: CORE
            val p = pack(name)
            if (!isKnownPack(name)) p.status = "none" else refresh(p, path == "/__fetch")
            val body = ("{\"status\":\"" + p.status + "\",\"percent\":" + p.percent + ",\"detail\":\"" + p.detail.replace("\"", "'") + "\"}").toByteArray()
            write(out, 200, "OK", mapOf("Content-Type" to "application/json"), body.inputStream(), body.size.toLong(), method == "HEAD")
            return
        }
        val base = pack(packOf(path)).root
        if (base == null || path.contains("..")) { write(out, 404, "Not Found", emptyMap(), null, 0, false); return }
        val file = File(base, path.trimStart('/'))
        if (!file.isFile) { write(out, 404, "Not Found", emptyMap(), null, 0, false); return }
        val len = file.length()
        var start = 0L
        var end = len - 1
        var code = 200
        val range = headers["range"]
        if (range != null && range.startsWith("bytes=")) {
            val spec = range.removePrefix("bytes=").substringBefore(',').trim()
            val a = spec.substringBefore('-')
            val b = spec.substringAfter('-', "")
            try {
                if (a.isEmpty()) {
                    start = maxOf(0L, len - b.toLong())
                } else {
                    start = a.toLong()
                    if (b.isNotEmpty()) end = minOf(end, b.toLong())
                }
                if (start > end || start >= len) {
                    write(out, 416, "Range Not Satisfiable", mapOf("Content-Range" to "bytes */$len"), null, 0, false)
                    return
                }
                code = 206
            } catch (ignored: Throwable) { start = 0; end = len - 1 }
        }
        val extra = HashMap<String, String>()
        extra["Content-Type"] = mime(file.name)
        if (code == 206) extra["Content-Range"] = "bytes $start-$end/$len"
        val count = end - start + 1
        file.inputStream().use { fin ->
            fin.skip(start)
            write(out, code, if (code == 206) "Partial Content" else "OK", extra, fin, count, method == "HEAD")
        }
    }

    private fun write(out: OutputStream, code: Int, text: String, extra: Map<String, String>, body: InputStream?, length: Long, headOnly: Boolean) {
        val sb = StringBuilder()
        sb.append("HTTP/1.1 ").append(code).append(' ').append(text).append("\r\n")
        sb.append("Accept-Ranges: bytes\r\n")
        sb.append("Access-Control-Allow-Origin: *\r\n")
        sb.append("Access-Control-Allow-Headers: Range\r\n")
        sb.append("Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges\r\n")
        sb.append("Cross-Origin-Resource-Policy: cross-origin\r\n")
        sb.append("Cache-Control: no-cache\r\n")
        for ((k, v) in extra) sb.append(k).append(": ").append(v).append("\r\n")
        sb.append("Content-Length: ").append(if (body == null) 0 else length).append("\r\n")
        sb.append("Connection: close\r\n\r\n")
        out.write(sb.toString().toByteArray())
        if (body != null && !headOnly) {
            val buf = ByteArray(64 * 1024)
            var left = length
            while (left > 0) {
                val n = body.read(buf, 0, minOf(buf.size.toLong(), left).toInt())
                if (n <= 0) break
                out.write(buf, 0, n)
                left -= n
            }
        }
        out.flush()
    }

    private fun readLine(input: InputStream): String? {
        val sb = StringBuilder()
        while (true) {
            val c = input.read()
            if (c < 0) return if (sb.isEmpty()) null else sb.toString()
            if (c == '\n'.code) return sb.toString().trimEnd('\r')
            sb.append(c.toChar())
            if (sb.length > 8192) return null
        }
    }

    private fun mime(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
        "webp" -> "image/webp"
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "mp3" -> "audio/mpeg"
        "ogg", "opus" -> "audio/ogg"
        "m4a", "aac" -> "audio/mp4"
        "json" -> "application/json"
        else -> "application/octet-stream"
    }
}
