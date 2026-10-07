const COMMANDS: &[&str] = &["can_make_payments"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).ios_path("ios").build();
}
