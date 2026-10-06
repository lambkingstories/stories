//! Saves a PNG straight into the iOS photo library.
//!
//! The coloring page's download button can't use `<a download>` in the app:
//! WKWebView ignores the attribute, so the tap does nothing. On iOS a saved
//! picture belongs in Photos anyway, so the button hands the PNG to this
//! plugin instead. The Swift side asks for add-only Photos access, which is
//! what `NSPhotoLibraryAddUsageDescription` in `Info.ios.plist` is for.

use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_save_photo);

#[derive(Serialize, Deserialize)]
struct SaveRequest {
    /// The PNG, base64-encoded without a `data:` prefix.
    data: String,
}

/// `{ "status": "saved" | "denied" }` — a refused permission is an outcome,
/// not an error, so the page can explain it instead of falling back.
type SaveResponse = serde_json::Value;

#[cfg(target_os = "ios")]
struct Handle<R: Runtime>(tauri::plugin::PluginHandle<R>);

#[tauri::command]
async fn save<R: Runtime>(app: tauri::AppHandle<R>, data: String) -> Result<SaveResponse, String> {
    #[cfg(target_os = "ios")]
    {
        use tauri::Manager;
        let handle = app.state::<Handle<R>>();
        return handle
            .0
            .run_mobile_plugin("save", SaveRequest { data })
            .map_err(|e| e.to_string());
    }
    #[cfg(not(target_os = "ios"))]
    {
        let _ = (app, data);
        Err("saving to the photo library is only available on iOS".into())
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R, ()>::new("save-photo")
        .invoke_handler(tauri::generate_handler![save])
        .setup(|_app, _api| {
            #[cfg(target_os = "ios")]
            {
                use tauri::Manager;
                let handle = _api.register_ios_plugin(init_plugin_save_photo)?;
                _app.manage(Handle(handle));
            }
            Ok(())
        })
        .build()
}
