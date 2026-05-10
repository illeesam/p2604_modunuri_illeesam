import UIKit

/// ShopjoyFoApp 의 [UIWindowSceneDelegate] — iOS 13+ 멀티 윈도우 라이프사이클.
///
/// **역할**:
/// - Scene 연결 시 [WebViewController] 를 root 로 갖는 UIWindow 생성
/// - 딥링크 (`shopjoy-fo://`) 수신 시 WebViewController 에 전달
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    /// 현재 Scene 의 윈도우. iPhone 은 보통 1개, iPad 는 멀티 윈도우 가능.
    var window: UIWindow?

    /// Scene 이 시스템에 연결되어 첫 화면을 구성해야 할 때 호출.
    ///
    /// - Parameters:
    ///   - scene:               연결되는 UIScene (UIWindowScene 으로 캐스팅 필요).
    ///   - session:              Scene 의 영속 세션 정보.
    ///   - connectionOptions:   딥링크 / 단축어 / 푸시 등으로 시작된 경우 추가 정보.
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        SjLog.fn(["urlContexts": connectionOptions.urlContexts.count])
        SjLog.lifecycle("scene.willConnectTo")

        // UIScene → UIWindowScene 다운캐스트. iOS 13+ 에서 항상 성공해야 정상.
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

        // 딥링크로 앱이 시작된 경우 (cold start) — initial URL 처리.
        if let urlContext = connectionOptions.urlContexts.first {
            SjLog.d("initial deepLink found", vars: ["url": urlContext.url.absoluteString])
            vc.handleDeepLink(urlContext.url)
        }
    }

    // ── Scene 라이프사이클 (사용자가 멀티태스킹 / 앱 전환 시) ──

    /// Scene 연결 해제 — 멀티태스킹에서 제거되었거나 메모리 회수.
    func sceneDidDisconnect(_ scene: UIScene) {
        SjLog.fn(); SjLog.lifecycle("sceneDidDisconnect")
    }

    /// Scene 활성화 — 입력 응답 시작.
    func sceneDidBecomeActive(_ scene: UIScene) {
        SjLog.fn(); SjLog.lifecycle("sceneDidBecomeActive")
    }

    /// Scene 인터럽션 시작 (제어 센터 / 알림 슬라이드 등).
    func sceneWillResignActive(_ scene: UIScene) {
        SjLog.fn(); SjLog.lifecycle("sceneWillResignActive")
    }

    /// Scene 이 백그라운드 → 포그라운드.
    func sceneWillEnterForeground(_ scene: UIScene) {
        SjLog.fn(); SjLog.lifecycle("sceneWillEnterForeground")
    }

    /// Scene 이 백그라운드 진입.
    func sceneDidEnterBackground(_ scene: UIScene) {
        SjLog.fn(); SjLog.lifecycle("sceneDidEnterBackground")
    }

    /// 앱 실행 중에 딥링크 / Universal Link 수신.
    /// (cold start 와 다름 — 그건 willConnectTo 의 connectionOptions 에서 처리)
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
