//! "Save as PDF" on Android: the web view ignores `<a download>` and has no share sheet, so the system's
//! "save to" dialog is opened and the bytes are written to the place the person picks. No permission is needed.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.stories.lambking.savefile";

#[cfg(target_os = "android")]
struct Handle<R: Runtime>(tauri::plugin::PluginHandle<R>);

/// `data` is the file as base64. Resolves `{ "status": "saved" | "cancelled" }`.
#[tauri::command]
async fn save<R: Runtime>(app: tauri::AppHandle<R>, name: String, mime: String, data: String) -> Result<serde_json::Value, String> {
    #[cfg(target_os = "android")]
    {
        use tauri::Manager;
        let handle = app.state::<Handle<R>>();
        return handle
            .0
            .run_mobile_plugin("save", serde_json::json!({ "name": name, "mime": mime, "data": data }))
            .map_err(|e| e.to_string());
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, name, mime, data);
        Err("saving a file this way is only available on Android".into())
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R, ()>::new("save-file")
        .invoke_handler(tauri::generate_handler![save])
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            {
                use tauri::Manager;
                let handle = _api.register_android_plugin(PLUGIN_IDENTIFIER, "SaveFilePlugin")?;
                _app.manage(Handle(handle));
            }
            Ok(())
        })
        .build()
}
