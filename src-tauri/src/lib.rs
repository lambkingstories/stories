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

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
