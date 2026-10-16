//! Passes the Apple Pencil's double tap on to the page.
//!
//! WKWebView never reports the Pencil's double tap (or the squeeze of the Pencil Pro) to a web page; only native
//! code gets it, through `UIPencilInteraction`. The Swift side of this plugin adds such an interaction to the web
//! view and, on every double tap, dispatches `lambking-pencil-tap` on the page's `window`. The coloring screen
//! listens for it and switches between the eraser and the tool before. There are no commands to call.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_pencil);

#[cfg(target_os = "ios")]
struct Keep<R: Runtime>(#[allow(dead_code)] tauri::plugin::PluginHandle<R>);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R, ()>::new("pencil")
        .setup(|_app, _api| {
            #[cfg(target_os = "ios")]
            {
                use tauri::Manager;
                let handle = _api.register_ios_plugin(init_plugin_pencil)?;
                _app.manage(Keep(handle));
            }
            Ok(())
        })
        .build()
}
