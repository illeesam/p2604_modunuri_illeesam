import UIKit

/// ShopjoyBoApp 의 [UIWindowSceneDelegate] (관리자용 윈도우 라이프사이클).
///
/// @see ShopjoyFoApp.SceneDelegate  FO 의 같은 클래스 — 자세한 주석은 거기 참조
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    /// 현재 Scene 의 윈도우.
    var window: UIWindow?

    /// Scene 연결 시 첫 화면 구성.
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        SjLog.fn(["urlContexts": connectionOptions.urlContexts.count])
        SjLog.lifecycle("scene.willConnectTo")

        guard let windowScene = scene as? UIWindowScene else {
            SjLog.w("scene cast failed")
            return
        }
        let window = UIWindow(windowScene: windowScene)
        let vc = WebViewController()
        window.rootViewController = vc
        self.window = window
        window.makeKeyAndVisible()
        SjLog.d("window made visible")

        // cold start 딥링크 (앱이 deep link 로 시작된 경우).
        if let urlContext = connectionOptions.urlContexts.first {
            SjLog.d("initial deepLink found", vars: ["url": urlContext.url.absoluteString])
            vc.handleDeepLink(urlContext.url)
        }
    }

    // ── Scene 라이프사이클 ──
    func sceneDidDisconnect(_ scene: UIScene)      { SjLog.fn(); SjLog.lifecycle("sceneDidDisconnect") }
    func sceneDidBecomeActive(_ scene: UIScene)    { SjLog.fn(); SjLog.lifecycle("sceneDidBecomeActive") }
    func sceneWillResignActive(_ scene: UIScene)   { SjLog.fn(); SjLog.lifecycle("sceneWillResignActive") }
    func sceneWillEnterForeground(_ scene: UIScene) { SjLog.fn(); SjLog.lifecycle("sceneWillEnterForeground") }
    func sceneDidEnterBackground(_ scene: UIScene) { SjLog.fn(); SjLog.lifecycle("sceneDidEnterBackground") }

    /// 앱 실행 중 딥링크 / Universal Link 수신.
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SjLog.fn(["count": URLContexts.count])
        guard let url = URLContexts.first?.url else {
            SjLog.w("openURLContexts empty")
            return
        }
        SjLog.d("openURLContexts", vars: ["url": url.absoluteString])
        if let vc = window?.rootViewController as? WebViewController {
            vc.handleDeepLink(url)
        }
    }
}
