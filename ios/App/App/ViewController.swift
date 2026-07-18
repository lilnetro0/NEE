import UIKit
import Capacitor

/// Enables the native iOS interactive edge-swipe back gesture.
/// The app is an SPA using the History API; WKWebView tracks pushState
/// entries in its back-forward list, so the OS gesture drives router
/// navigation exactly like a native navigation stack.
class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}
