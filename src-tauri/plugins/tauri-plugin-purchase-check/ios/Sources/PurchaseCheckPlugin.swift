import StoreKit
import SwiftRs
import Tauri
import UIKit
import WebKit

class IntroArgs: Decodable {
  let productIds: [String]
}

struct IntroOffers: Encodable {
  /// Product id -> the introductory price this Apple account still gets.
  let offers: [String: String]
}

class PurchaseCheckPlugin: Plugin {
  /// False when Screen Time or a device-management profile (a work iPad)
  /// blocks in-app purchases. StoreKit then refuses every purchase, so the
  /// app says so up front instead of "please try again".
  @objc public func canMakePayments(_ invoke: Invoke) throws {
    invoke.resolve(["allowed": SKPaymentQueue.canMakePayments()])
  }

  /// Apple gives an introductory price only once per subscription group. Only the products for which this account can
  /// still get it are returned, so the app never promises a price the purchase sheet then does not show.
  @objc public func introOffers(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(IntroArgs.self)
    guard #available(iOS 15.0, *) else {
      invoke.resolve(IntroOffers(offers: [:]))
      return
    }
    Task {
      do {
        var offers: [String: String] = [:]
        for product in try await StoreKit.Product.products(for: args.productIds) {
          guard let subscription = product.subscription, let intro = subscription.introductoryOffer else { continue }
          let eligible = await subscription.isEligibleForIntroOffer
          if eligible {
            offers[product.id] = intro.displayPrice
          }
        }
        invoke.resolve(IntroOffers(offers: offers))
      } catch {
        invoke.reject(error.localizedDescription)
      }
    }
  }
}

@_cdecl("init_plugin_purchase_check")
func initPlugin() -> Plugin {
  return PurchaseCheckPlugin()
}
