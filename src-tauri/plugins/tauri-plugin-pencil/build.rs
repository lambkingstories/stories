// No commands: the Swift side talks to the page by itself (see PencilPlugin.swift).
const COMMANDS: &[&str] = &[];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).ios_path("ios").build();
}
