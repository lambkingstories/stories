import Photos
import SwiftRs
import Tauri
import UIKit
import WebKit

class SaveArgs: Decodable {
  /// The PNG, base64-encoded without a `data:` prefix.
  let data: String
}

class SavePhotoPlugin: Plugin {
  @objc public func save(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(SaveArgs.self)
    guard let bytes = Data(base64Encoded: args.data) else {
      invoke.reject("The picture could not be read.")
      return
    }

    let write = {
      PHPhotoLibrary.shared().performChanges({
        PHAssetCreationRequest.forAsset().addResource(with: .photo, data: bytes, options: nil)
      }) { ok, error in
        if ok {
          invoke.resolve(["status": "saved"])
        } else {
          invoke.reject(error?.localizedDescription ?? "The picture could not be saved.")
        }
      }
    }

    // Add-only access: the app never reads the library, so it never asks
    // for more than writing one picture into it.
    let handle: (PHAuthorizationStatus) -> Void = { status in
      switch status {
      case .authorized, .limited:
        write()
      default:
        invoke.resolve(["status": "denied"])
      }
    }
    PHPhotoLibrary.requestAuthorization(for: .addOnly, handler: handle)
  }
}

@_cdecl("init_plugin_save_photo")
func initPlugin() -> Plugin {
  return SavePhotoPlugin()
}
