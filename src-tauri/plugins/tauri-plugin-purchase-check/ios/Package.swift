// swift-tools-version:5.3

import PackageDescription

let package = Package(
    name: "tauri-plugin-purchase-check",
    platforms: [
        .iOS(.v14),
    ],
    products: [
        .library(
            name: "tauri-plugin-purchase-check",
            type: .static,
            targets: ["tauri-plugin-purchase-check"]),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api")
    ],
    targets: [
        .target(
            name: "tauri-plugin-purchase-check",
            dependencies: [
                .byName(name: "Tauri")
            ],
            path: "Sources")
    ]
)
