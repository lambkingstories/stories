#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());

    // StoreKit tips — see `[target.'cfg(target_os = "ios")'.dependencies]` in
    // Cargo.toml. Android and desktop keep the PayPal / Ko-fi links instead.
    #[cfg(target_os = "ios")]
    let builder = builder.plugin(tauri_plugin_iap::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
