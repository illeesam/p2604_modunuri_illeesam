import UIKit

/// ShopjoyBoApp 의 [UIApplicationDelegate] (관리자용).
///
/// - 빌드/디바이스 정보 출력 (운영 로그 추적용)
/// - APNs 푸시 권한 요청 + 등록
///
/// @see ShopjoyFoApp.AppDelegate  FO 의 같은 클래스 — 자세한 주석은 거기 참조
@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    /// 앱 프로세스 시작 진입점.
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        SjLog.fn(["launchOptions": launchOptions?.keys.map { "\($0)" } ?? []])

        SjLog.appStart([
            "bundleId":         Bundle.main.bundleIdentifier ?? "",
            "version":          Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") ?? "",
            "build":            Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") ?? "",
            "displayName":      Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") ?? "",
            "baseUrl":          Bundle.main.object(forInfoDictionaryKey: "INFOPLIST_KEY_BASE_URL") ?? "",
            "iosVersion":       UIDevice.current.systemVersion,
            "deviceModel":      UIDevice.current.model,
            "deviceName":       UIDevice.current.name
        ])

        registerForPushNotifications(application)
        SjLog.lifecycle("application.didFinishLaunching")
        return true
    }

    // ── 앱 라이프사이클 ──
    func applicationWillResignActive(_ application: UIApplication)    { SjLog.fn(); SjLog.lifecycle("applicationWillResignActive") }
    func applicationDidEnterBackground(_ application: UIApplication)  { SjLog.fn(); SjLog.lifecycle("applicationDidEnterBackground") }
    func applicationWillEnterForeground(_ application: UIApplication) { SjLog.fn(); SjLog.lifecycle("applicationWillEnterForeground") }
    func applicationDidBecomeActive(_ application: UIApplication)     { SjLog.fn(); SjLog.lifecycle("applicationDidBecomeActive") }
    func applicationWillTerminate(_ application: UIApplication)       { SjLog.fn(); SjLog.appEnd("applicationWillTerminate") }

    /// Scene 구성 정보 제공 (iOS 13+).
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        SjLog.fn(["role": "\(connectingSceneSession.role.rawValue)"])
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    /// 푸시 권한 요청 — 콜백은 메인 스레드 외이므로 main 으로 dispatch.
    private func registerForPushNotifications(_ application: UIApplication) {
        SjLog.fn()
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            SjLog.i("push permission result", vars: ["granted": granted, "error": error?.localizedDescription as Any])
            guard granted else { return }
            DispatchQueue.main.async {
                SjLog.d("registerForRemoteNotifications")
                application.registerForRemoteNotifications()
            }
        }
    }

    /// APNs 디바이스 토큰 발급 — hex 문자열로 백엔드 등록.
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // 256바이트 → 64자 hex.
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        SjLog.fn(["tokenLen": deviceToken.count])
        SjLog.i("APNs BO token registered", vars: ["token": token])
    }

    /// APNs 등록 실패.
    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        SjLog.e("APNs register failed", error: error)
    }
}
