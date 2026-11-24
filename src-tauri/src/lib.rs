// Media outside the program file (the test for 1.3, see src/utils/mediaSplit.ts): the pictures and sounds of some adventures lie as plain files next to the program
// (`bundle.resources`, folder `_up_/dist-media` below the resource folder). Tauri's own asset protocol did not load them on iOS (first try on a real iPad, 24.11.2026),
// so this small protocol `lkmedia://localhost/<path>` reads them itself. It answers Range requests (the sound player of the iPhone asks for them).
#[cfg(target_os = "ios")]
fn media_protocol<R: tauri::Runtime>(
    ctx: tauri::UriSchemeContext<'_, R>,
    request: tauri::http::Request<Vec<u8>>,
) -> tauri::http::Response<Vec<u8>> {
    use tauri::Manager;

    fn reply(status: u16, body: Vec<u8>) -> tauri::http::Response<Vec<u8>> {
        tauri::http::Response::builder()
            .status(status)
            .header("Access-Control-Allow-Origin", "*")
            .body(body)
            .unwrap()
    }

    // %XX -> byte (the paths are plain ASCII, so this is all that is needed)
    fn decode(raw: &str) -> String {
        let bytes = raw.as_bytes();
        let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
        let mut i = 0;
        while i < bytes.len() {
            if bytes[i] == b'%' && i + 2 < bytes.len() {
                if let Ok(hex) = std::str::from_utf8(&bytes[i + 1..i + 3]) {
                    if let Ok(v) = u8::from_str_radix(hex, 16) {
                        out.push(v);
                        i += 3;
                        continue;
                    }
                }
            }
            out.push(bytes[i]);
            i += 1;
        }
        String::from_utf8_lossy(&out).to_string()
    }

    let rel = decode(request.uri().path().trim_start_matches('/'));
    if rel.is_empty() || rel.contains("..") {
        return reply(404, Vec::new());
    }
    let base = match ctx.app_handle().path().resource_dir() {
        Ok(dir) => dir.join("_up_").join("dist-media"),
        Err(_) => return reply(500, Vec::new()),
    };
    let data = match std::fs::read(base.join(&rel)) {
        Ok(d) => d,
        Err(_) => return reply(404, Vec::new()),
    };
    let mime = match rel.rsplit('.').next().unwrap_or("") {
        "webp" => "image/webp",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "mp3" => "audio/mpeg",
        "json" => "application/json",
        _ => "application/octet-stream",
    };
    let total = data.len();
    // Range: bytes=START-END
    if let Some(range) = request.headers().get("range").and_then(|v| v.to_str().ok()) {
        if let Some(spec) = range.strip_prefix("bytes=") {
            let mut parts = spec.splitn(2, '-');
            let start = parts.next().and_then(|s| s.parse::<usize>().ok()).unwrap_or(0);
            let end = parts
                .next()
                .and_then(|s| s.parse::<usize>().ok())
                .unwrap_or(total.saturating_sub(1))
                .min(total.saturating_sub(1));
            if start <= end && start < total {
                return tauri::http::Response::builder()
                    .status(206)
                    .header("Content-Type", mime)
                    .header("Accept-Ranges", "bytes")
                    .header("Content-Range", format!("bytes {}-{}/{}", start, end, total))
                    .header("Access-Control-Allow-Origin", "*")
                    .body(data[start..=end].to_vec())
                    .unwrap();
            }
        }
    }
    tauri::http::Response::builder()
        .status(200)
        .header("Content-Type", mime)
        .header("Accept-Ranges", "bytes")
        .header("Access-Control-Allow-Origin", "*")
        .body(data)
        .unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());

    // In-app purchases: StoreKit on iOS, Play Billing on Android (LambKing Plus,
    // coloring books; tips only on iOS). See Cargo.toml.
    #[cfg(any(target_os = "ios", target_os = "android"))]
    let builder = builder.plugin(tauri_plugin_iap::init());

    // Coloring page download — saves the picture to Photos (see the plugin).
    #[cfg(target_os = "ios")]
    let builder = builder.plugin(tauri_plugin_save_photo::init());

    // Whether this device may buy at all (Screen Time / work iPad), for the
    // tip sheet's message.
    #[cfg(target_os = "ios")]
    let builder = builder.plugin(tauri_plugin_purchase_check::init());

    // Apple Pencil double tap -> eraser on / off in the coloring screen.
    #[cfg(target_os = "ios")]
    let builder = builder.plugin(tauri_plugin_pencil::init());

    // Media outside the program file (the test for 1.3): `lkmedia://localhost/<path>` reads a file of `_up_/dist-media` (see above). Harmless when that folder is absent.
    #[cfg(target_os = "ios")]
    let builder = builder.register_uri_scheme_protocol("lkmedia", |ctx, request| media_protocol(ctx, request));

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
