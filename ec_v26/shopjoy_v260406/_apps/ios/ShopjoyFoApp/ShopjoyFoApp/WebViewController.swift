import UIKit
import WebKit

/// ShopjoyFoApp 의 단일 ViewController — WKWebView 1개로 ShopJoy FO 웹사이트 호스팅.
///
/// **역할**:
/// 1. WKWebView 초기 설정 (JavaScript / 미디어 / Inspector 등)
/// 2. 환경별 BASE_URL (Info.plist 의 `INFOPLIST_KEY_BASE_URL`) 로드
/// 3. `decidePolicyFor` 에서 URL 진입 가로채서 외부 앱 / 자체 딥링크 분기
/// 4. 딥링크 (`shopjoy-fo://`) 수신 시 WebView JS 에 전달
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    /// 메인 WKWebView 인스턴스. `viewDidLoad` 에서 생성.
    private var webView: WKWebView!

    /// 페이지 로드 진행 중 표시되는 회전 indicator.
    private var progressView: UIActivityIndicatorView!

    /// 환경별 BASE_URL — 빌드 설정 (`INFOPLIST_KEY_BASE_URL`) 으로 주입됨.
    /// project.yml 의 Configuration 별 (`Debug-Local` / `Debug-Dev` / `Debug-Prod`) 값.
    private var baseUrl: String {
        let url = Bundle.main.object(forInfoDictionaryKey: "INFOPLIST_KEY_BASE_URL") as? String
            ?? "http://127.0.0.1:5501"
        SjLog.d("baseUrl resolved", vars: ["url": url])
        return url
    }

    // MARK: - View Lifecycle

    /// View 가 메모리에 로드된 직후 호출 — UI 구성 + 초기 URL 로드.
    override func viewDidLoad() {
        SjLog.fn(); SjLog.lifecycle("viewDidLoad")
        super.viewDidLoad()
        setupWebView()
        loadInitialUrl()
    }

    /// View 가 화면에 표시되기 직전.
    override func viewWillAppear(_ animated: Bool) {
        SjLog.fn(["animated": animated]); SjLog.lifecycle("viewWillAppear")
        super.viewWillAppear(animated)
    }

    /// View 가 화면에 완전히 표시된 후.
    override func viewDidAppear(_ animated: Bool) {
        SjLog.fn(["animated": animated]); SjLog.lifecycle("viewDidAppear")
        super.viewDidAppear(animated)
    }

    /// View 가 화면에서 사라지기 직전.
    override func viewWillDisappear(_ animated: Bool) {
        SjLog.fn(["animated": animated]); SjLog.lifecycle("viewWillDisappear")
        super.viewWillDisappear(animated)
    }

    /// View 가 화면에서 완전히 사라진 후.
    override func viewDidDisappear(_ animated: Bool) {
        SjLog.fn(["animated": animated]); SjLog.lifecycle("viewDidDisappear")
        super.viewDidDisappear(animated)
    }

    // MARK: - WebView Setup

    /// WKWebView 인스턴스 생성 + 기본 설정 + view 계층에 추가.
    private func setupWebView() {
        SjLog.fn()
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true                    // <video> 인라인 재생 허용 (전체화면 강제 X).
        cfg.mediaTypesRequiringUserActionForPlayback = []       // 자동재생 허용 (이벤트 페이지 미디어).
        cfg.preferences.javaScriptCanOpenWindowsAutomatically = true  // JS 의 window.open() 허용.
        SjLog.d("WKWebViewConfiguration built",
                vars: ["allowsInlineMediaPlayback": cfg.allowsInlineMediaPlayback])

        webView = WKWebView(frame: view.bounds, configuration: cfg)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self                       // URL / 페이지 로드 단계 콜백.
        webView.uiDelegate = self                               // JS alert/popup 콜백.
        webView.allowsBackForwardNavigationGestures = true      // 좌우 swipe 로 history 이동.
        webView.scrollView.bounces = true
        if #available(iOS 16.4, *) {
            // Safari Web Inspector 로 디버그 가능. iOS 16.4+ 부터 명시 활성화 필요.
            webView.isInspectable = true
            SjLog.d("webView.isInspectable = true (iOS 16.4+)")
        }
        view.addSubview(webView)
        SjLog.d("WKWebView added to view")

        // 페이지 로드 진행 중 표시할 회전 indicator.
        progressView = UIActivityIndicatorView(style: .large)
        progressView.center = view.center
        // 화면 회전 / 사이즈 변경 시 중앙 유지.
        progressView.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin,
                                         .flexibleTopMargin, .flexibleBottomMargin]
        view.addSubview(progressView)
        progressView.startAnimating()
        SjLog.d("progressView started")
    }

    /// 빌드 설정의 BASE_URL 로 첫 페이지 로드.
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

    /// 딥링크 URL 을 WebView JS 에 전달.
    ///
    /// `window.onAppDeepLink(url)` JS 함수가 SPA 라우팅을 수행하는 책임.
    /// SceneDelegate 가 cold start / 실행 중 양쪽 케이스에서 본 메서드 호출.
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

    // MARK: - WKNavigationDelegate (URL 진입 / 페이지 로드 단계)

    /// 새 URL 진입 시 호출 — 허용 / 차단 / 외부 앱 위임 결정.
    ///
    /// **분기 정책**:
    /// 1. `shopjoy-fo://` → 자체 딥링크, WebView JS 로 전달 (cancel)
    /// 2. `kakaotalk:` / `kakaopay:` / `supertoss:` 등 → 외부 앱 (UIApplication.open)
    /// 3. 그 외 (`http(s)://`) → WebView 가 직접 로드 (allow)
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

        // 자체 딥링크 처리.
        if url.scheme == "shopjoy-fo" {
            SjLog.webview("→ deepLink (cancel WebView load)", url: url.absoluteString)
            handleDeepLink(url)
            decisionHandler(.cancel)
            return
        }

        // 외부 앱 (카카오톡 / 카카오페이 / 토스 / 결제 SDK).
        let externalSchemes = ["kakaotalk", "kakaopay", "kakaolink", "supertoss", "tossapp", "ispmobile"]
        if let scheme = url.scheme, externalSchemes.contains(scheme) {
            SjLog.webview("→ externalApp (UIApplication.open)", url: url.absoluteString,
                          vars: ["scheme": scheme])
            UIApplication.shared.open(url, options: [:]) { ok in
                SjLog.i("external open result", vars: ["ok": ok, "scheme": scheme])
            }
            decisionHandler(.cancel)
            return
        }

        SjLog.webview("→ allow", url: url.absoluteString)
        decisionHandler(.allow)
    }

    /// 새 페이지 로드 시작 (provisional = 헤더 받기 전 단계).
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        SjLog.webview("didStartProvisionalNavigation", url: webView.url?.absoluteString)
    }

    /// 페이지 로드 완료 — progress indicator 숨김.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        SjLog.webview("didFinish", url: webView.url?.absoluteString)
        progressView.stopAnimating()
    }

    /// 헤더 받기 전 실패 (DNS / SSL / 연결 거부 등).
    func webView(_ webView: WKWebView, didFailProvisionalNavigation: WKNavigation!, withError error: Error) {
        SjLog.e("WebView didFailProvisionalNavigation", error: error,
                vars: ["url": webView.url?.absoluteString as Any])
        progressView.stopAnimating()
    }

    /// 헤더 받은 후 실패 (응답 처리 중 오류).
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        SjLog.e("WebView didFail", error: error,
                vars: ["url": webView.url?.absoluteString as Any])
        progressView.stopAnimating()
    }

    // MARK: - WKUIDelegate (JS alert / popup)

    /// JS 의 `window.open()` 으로 새 창 요청 시 호출.
    ///
    /// **정책**: 새 창 대신 현재 webView 에서 같은 요청 로드 (인앱브라우저 단일 운영).
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        SjLog.webview("createWebViewWith (popup)", url: navigationAction.request.url?.absoluteString)
        // targetFrame == nil → 새 창 요청. 현재 webView 에서 처리.
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
}
