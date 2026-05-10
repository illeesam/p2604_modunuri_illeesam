import UIKit
import WebKit
import LocalAuthentication

/// ShopjoyBoApp 의 단일 ViewController — WKWebView 로 BO 웹사이트 호스팅 + 생체인증 지원.
///
/// **FO 와의 차이점**:
/// - 외부 결제 앱 위임 분기 단순화 (관리자는 결제 안 함)
/// - 자체 딥링크 scheme `shopjoy-bo://`
/// - [authenticateWithBiometric] 메서드 추가 (관리자 빠른 로그인)
///
/// @see ShopjoyFoApp.WebViewController  FO 의 같은 클래스 — 자세한 주석은 거기 참조
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    /// 메인 WKWebView 인스턴스.
    private var webView: WKWebView!

    /// 페이지 로드 진행 중 회전 indicator.
    private var progressView: UIActivityIndicatorView!

    /// 환경별 BASE_URL — Info.plist 의 `INFOPLIST_KEY_BASE_URL` 로 주입됨.
    private var baseUrl: String {
        let url = Bundle.main.object(forInfoDictionaryKey: "INFOPLIST_KEY_BASE_URL") as? String
            ?? "http://127.0.0.1:5501/bo.html"
        SjLog.d("baseUrl resolved", vars: ["url": url])
        return url
    }

    // MARK: - View Lifecycle

    override func viewDidLoad() {
        SjLog.fn(); SjLog.lifecycle("viewDidLoad")
        super.viewDidLoad()
        setupWebView()
        loadInitialUrl()
    }

    override func viewWillAppear(_ animated: Bool)    { SjLog.fn(["animated": animated]); SjLog.lifecycle("viewWillAppear"); super.viewWillAppear(animated) }
    override func viewDidAppear(_ animated: Bool)     { SjLog.fn(["animated": animated]); SjLog.lifecycle("viewDidAppear"); super.viewDidAppear(animated) }
    override func viewWillDisappear(_ animated: Bool) { SjLog.fn(["animated": animated]); SjLog.lifecycle("viewWillDisappear"); super.viewWillDisappear(animated) }
    override func viewDidDisappear(_ animated: Bool)  { SjLog.fn(["animated": animated]); SjLog.lifecycle("viewDidDisappear"); super.viewDidDisappear(animated) }

    // MARK: - WebView Setup

    /// WKWebView 초기 설정.
    private func setupWebView() {
        SjLog.fn()
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        SjLog.d("WKWebViewConfiguration built")

        webView = WKWebView(frame: view.bounds, configuration: cfg)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        if #available(iOS 16.4, *) {
            // Safari Web Inspector 에서 디버그 가능 (iOS 16.4+).
            webView.isInspectable = true
            SjLog.d("webView.isInspectable = true (iOS 16.4+)")
        }
        view.addSubview(webView)
        SjLog.d("WKWebView added")

        progressView = UIActivityIndicatorView(style: .large)
        progressView.center = view.center
        progressView.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin,
                                         .flexibleTopMargin, .flexibleBottomMargin]
        view.addSubview(progressView)
        progressView.startAnimating()
    }

    /// 초기 URL 로드.
    private func loadInitialUrl() {
        SjLog.fn()
        guard let url = URL(string: baseUrl) else {
            SjLog.e("invalid baseUrl", vars: ["baseUrl": baseUrl])
            return
        }
        SjLog.webview("load (initial)", url: url.absoluteString)
        webView.load(URLRequest(url: url))
    }

    // MARK: - DeepLink Handler

    /// 딥링크 URL 을 WebView JS 에 전달 — `window.onAppDeepLink(url)` 호출.
    func handleDeepLink(_ url: URL) {
        SjLog.fn(["url": url.absoluteString])
        let js = "if (window.onAppDeepLink) window.onAppDeepLink('\(url.absoluteString)');"
        SjLog.webview("evaluateJavaScript (deepLink)", url: url.absoluteString, vars: ["js": js])
        webView.evaluateJavaScript(js) { result, error in
            if let error = error {
                SjLog.e("evaluateJavaScript failed", error: error)
            } else {
                SjLog.d("evaluateJavaScript ok", vars: ["result": "\(result ?? "nil")"])
            }
        }
    }

    // MARK: - 생체인증 (관리자 빠른 로그인)

    /// Face ID / Touch ID 로 본인 확인.
    ///
    /// **사용 시점**: 관리자가 미리 저장한 토큰으로 자동 로그인할 때 본인 확인용.
    ///
    /// - Parameter completion: `(success, error)` — 메인 스레드에서 호출됨.
    func authenticateWithBiometric(completion: @escaping (Bool, Error?) -> Void) {
        SjLog.fn()
        let ctx = LAContext()
        var error: NSError?
        // 디바이스에 Face ID / Touch ID 가 등록되어 있고 사용 가능한지 확인.
        let canEvaluate = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        SjLog.d("canEvaluatePolicy",
                vars: ["canEvaluate": canEvaluate, "error": error?.localizedDescription as Any])
        if canEvaluate {
            ctx.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                               localizedReason: "관리자 로그인") { ok, err in
                SjLog.i("biometric result", vars: ["ok": ok, "error": err?.localizedDescription as Any])
                // evaluatePolicy 콜백은 메인 스레드 외 — UI 업데이트 위해 main 으로 dispatch.
                DispatchQueue.main.async { completion(ok, err) }
            }
        } else {
            SjLog.w("biometric not available")
            completion(false, error)
        }
    }

    // MARK: - WKNavigationDelegate

    /// URL 진입 분기 — 자체 딥링크는 cancel + JS 전달, 그 외는 allow.
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            SjLog.w("navigationAction without url")
            decisionHandler(.cancel); return
        }
        SjLog.webview("decidePolicyFor", url: url.absoluteString,
                      vars: ["scheme": url.scheme ?? "?",
                             "navType": "\(navigationAction.navigationType.rawValue)"])

        if url.scheme == "shopjoy-bo" {
            SjLog.webview("→ deepLink (cancel)", url: url.absoluteString)
            handleDeepLink(url)
            decisionHandler(.cancel)
            return
        }
        SjLog.webview("→ allow", url: url.absoluteString)
        decisionHandler(.allow)
    }

    /// 페이지 로드 시작.
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        SjLog.webview("didStartProvisionalNavigation", url: webView.url?.absoluteString)
    }

    /// 페이지 로드 완료.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        SjLog.webview("didFinish", url: webView.url?.absoluteString)
        progressView.stopAnimating()
    }

    /// 헤더 받기 전 실패.
    func webView(_ webView: WKWebView, didFailProvisionalNavigation: WKNavigation!, withError error: Error) {
        SjLog.e("WebView didFailProvisionalNavigation", error: error,
                vars: ["url": webView.url?.absoluteString as Any])
        progressView.stopAnimating()
    }

    /// 헤더 받은 후 실패.
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        SjLog.e("WebView didFail", error: error,
                vars: ["url": webView.url?.absoluteString as Any])
        progressView.stopAnimating()
    }

    // MARK: - WKUIDelegate

    /// JS `window.open()` → 현재 webView 에서 같은 요청 로드 (인앱브라우저 단일).
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        SjLog.webview("createWebViewWith (popup)", url: navigationAction.request.url?.absoluteString)
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
}
