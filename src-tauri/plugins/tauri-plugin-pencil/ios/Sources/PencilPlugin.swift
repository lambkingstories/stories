import SwiftRs
import Tauri
import UIKit
import WebKit

/// Hears the Apple Pencil's double tap and tells the page about it.
///
/// The page listens for `lambking-pencil-tap` on `window`. Whether the event arrives at all depends on the
/// iPad's Settings > Apple Pencil > "Double-tap" choice; with "Off" the system does not call the delegate.
class PencilPlugin: Plugin, UIPencilInteractionDelegate {
  private weak var web: WKWebView?
  private var interaction: UIPencilInteraction?

  @objc public override func load(webview: WKWebView) {
    web = webview
    let pencil = UIPencilInteraction()
    pencil.delegate = self
    webview.addInteraction(pencil)
    interaction = pencil
  }

  // Deprecated since iOS 17.5 but still called; it compiles with every Xcode that builds the app.
  func pencilInteractionDidTap(_ interaction: UIPencilInteraction) {
    notifyPage()
  }

  private func notifyPage() {
    DispatchQueue.main.async { [weak self] in
      self?.web?.evaluateJavaScript(
        "window.dispatchEvent(new CustomEvent('lambking-pencil-tap'))",
        completionHandler: nil
      )
    }
  }
}

@_cdecl("init_plugin_pencil")
func initPlugin() -> Plugin {
  return PencilPlugin()
}
