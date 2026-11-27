const COMMANDS: &[&str] = &["can_make_payments", "intro_offers"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).ios_path("ios").build();
}
