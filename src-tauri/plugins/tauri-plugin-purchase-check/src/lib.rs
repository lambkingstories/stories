//! Asks StoreKit whether this device may make in-app purchases at all.
//!
//! `tauri-plugin-iap` has no such check, and on a device where Screen Time or
//! a device-management profile (a work iPad) blocks purchases its `purchase()`
//! just fails with a generic, localized error. The tip sheet asks this plugin
//! first so it can say "purchases are turned off on this device" instead.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_purchase_check);

/// `{ "allowed": bool }`
type CanMakePaymentsResponse = serde_json::Value;

#[cfg(target_os = "ios")]
struct Handle<R: Runtime>(tauri::plugin::PluginHandle<R>);

#[tauri::command]
async fn can_make_payments<R: Runtime>(app: tauri::AppHandle<R>) -> Result<CanMakePaymentsResponse, String> {
    #[cfg(target_os = "ios")]
    {
        use tauri::Manager;
        let handle = app.state::<Handle<R>>();
        return handle
            .0
            .run_mobile_plugin("canMakePayments", ())
            .map_err(|e| e.to_string());
    }
    #[cfg(not(target_os = "ios"))]
    {
        let _ = app;
        Err("the purchase check is only available on iOS".into())
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R, ()>::new("purchase-check")
        .invoke_handler(tauri::generate_handler![can_make_payments])
        .setup(|_app, _api| {
            #[cfg(target_os = "ios")]
            {
                use tauri::Manager;
                let handle = _api.register_ios_plugin(init_plugin_purchase_check)?;
                _app.manage(Handle(handle));
            }
            Ok(())
        })
        .build()
}
