package com.stories.lambking.savefile

import android.app.Activity
import android.content.Intent
import android.util.Base64
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class SaveArgs {
  lateinit var name: String
  lateinit var mime: String
  lateinit var data: String
}

@TauriPlugin
class SaveFilePlugin(private val activity: Activity) : Plugin(activity) {
  /** Opens the system's "save to" dialog with the suggested file name. */
  @Command
  fun save(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(SaveArgs::class.java)
      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT)
      intent.addCategory(Intent.CATEGORY_OPENABLE)
      intent.type = args.mime
      intent.putExtra(Intent.EXTRA_TITLE, args.name)
      startActivityForResult(invoke, intent, "saveResult")
    } catch (ex: Exception) {
      invoke.reject(ex.message ?: "The file could not be saved.")
    }
  }

  @ActivityCallback
  fun saveResult(invoke: Invoke, result: ActivityResult) {
    val uri = result.data?.data
    if (result.resultCode != Activity.RESULT_OK || uri == null) {
      answer(invoke, "cancelled")
      return
    }
    try {
      val args = invoke.parseArgs(SaveArgs::class.java)
      val out = activity.contentResolver.openOutputStream(uri) ?: throw IllegalStateException("The place cannot be written to.")
      out.use { it.write(Base64.decode(args.data, Base64.DEFAULT)) }
      answer(invoke, "saved")
    } catch (ex: Exception) {
      invoke.reject(ex.message ?: "The file could not be saved.")
    }
  }

  private fun answer(invoke: Invoke, status: String) {
    val ret = JSObject()
    ret.put("status", status)
    invoke.resolve(ret)
  }
}
