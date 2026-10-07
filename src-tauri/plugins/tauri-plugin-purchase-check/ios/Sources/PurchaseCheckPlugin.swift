import StoreKit
import SwiftRs
import Tauri
import UIKit
import WebKit

class PurchaseCheckPlugin: Plugin {
  /// False when Screen Time or a device-management profile (a work iPad)
  /// blocks in-app purchases. StoreKit then refuses every purchase, so the
  /// app says so up front instead of "please try again".
  @objc public func canMakePayments(_ invoke: Invoke) throws {
    invoke.resolve(["allowed": SKPaymentQueue.canMakePayments()])
  }
}

@_cdecl("init_plugin_purchase_check")
func initPlugin() -> Plugin {
  return PurchaseCheckPlugin()
}
