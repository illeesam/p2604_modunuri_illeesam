import UIKit
// import FirebaseCore         // FCM 활성화 시 주석 해제
// import FirebaseMessaging    // FCM 활성화 시 주석 해제

/// ShopjoyFoApp 의 [UIApplicationDelegate] 진입점.
///
/// **역할**:
/// - 앱 프로세스 시작 시 빌드/디바이스 정보 출력
/// - APNs (Apple Push Notification service) 푸시 권한 요청 + 등록
/// - SceneDelegate 구성 정보 제공 (iOS 13+)
///
/// `@main` 어노테이션 — 앱의 진입점 (info.plist 의 NSPrincipalClass 와 별개).
@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    /// 앱 프로세스 시작 시 호출되는 메인 진입점.
    ///
    /// 호출 순서: 시스템 초기화 → 본 메서드 → SceneDelegate.willConnectTo → ViewController 생성.
    ///
    /// - Parameters:
    ///   - application:   현재 UIApplication 싱글톤.
    ///   - launchOptions: 푸시 / URL / 단축어 등으로 앱이 시작된 경우 추가 정보.
    /// - Returns: 정상 시작 시 `true`. `false` 반환 시 일부 OS 기능 제한.
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        SjLog.fn(["launchOptions": launchOptions?.keys.map { "\($0)" } ?? []])

        // 앱 시작 시 빌드/디바이스 정보를 명시적으로 NSLog 출력 (Console.app 에서 검색 가능).
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

        // FirebaseApp.configure()                          // FCM 활성화 시 호출
        // Messaging.messaging().delegate = self            // FCM 토큰 콜백 등록
        registerForPushNotifications(application)
        SjLog.lifecycle("application.didFinishLaunching")
        return true
    }

    // ── 앱 라이프사이클 (사용자가 홈 버튼 / 앱 전환 등 수행 시) ──

    /// 사용자가 인터럽션 시작 (전화 수신 / 알림 슬라이드 등) — 입력 응답 일시 중단.
    func applicationWillResignActive(_ application: UIApplication) {
        SjLog.fn(); SjLog.lifecycle("applicationWillResignActive")
    }

    /// 앱이 백그라운드 진입 — 화면 캡처 보존되므로 민감 정보는 가리는 처리 가능 시점.
    func applicationDidEnterBackground(_ application: UIApplication) {
        SjLog.fn(); SjLog.lifecycle("applicationDidEnterBackground")
    }

    /// 앱이 백그라운드 → 포그라운드 진입 시작.
    func applicationWillEnterForeground(_ application: UIApplication) {
        SjLog.fn(); SjLog.lifecycle("applicationWillEnterForeground")
    }

    /// 앱이 활성화되어 입력 응답 시작.
    func applicationDidBecomeActive(_ application: UIApplication) {
        SjLog.fn(); SjLog.lifecycle("applicationDidBecomeActive")
    }

    /// 앱 종료 — 시스템이 메모리 회수 / 사용자가 강제 종료 등.
    /// 운영 환경에서는 보장되지 않음 (강제 종료 시 호출 안됨).
    func applicationWillTerminate(_ application: UIApplication) {
        SjLog.fn()
        SjLog.appEnd("applicationWillTerminate")
    }

    // MARK: - UISceneSession Lifecycle

    /// 새 Scene 세션 연결 시 Scene 구성 반환 (iOS 13+ 멀티 윈도우 지원).
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        SjLog.fn(["role": "\(connectingSceneSession.role.rawValue)"])
        // "Default Configuration" 은 Info.plist 의 UISceneConfigurations 항목과 일치 필수.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    /// Scene 세션 폐기 (사용자가 멀티태스킹에서 윈도우 제거).
    func application(_ application: UIApplication,
                     didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        SjLog.fn(["count": sceneSessions.count])
    }

    // MARK: - Push Notifications

    /// 푸시 알림 권한 요청 + APNs 등록.
    ///
    /// `requestAuthorization` 콜백은 메인 스레드 외에서 호출되므로
    /// `registerForRemoteNotifications` 는 main 으로 dispatch.
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

    /// APNs 디바이스 토큰 발급 성공 콜백.
    ///
    /// `deviceToken` 은 hex 문자열로 변환 후 백엔드에 등록 (FCM 사용 시 Messaging.apnsToken 으로 위임).
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // hex 문자열 변환 — 256바이트 → 64자 16진수.
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        SjLog.fn(["tokenLen": deviceToken.count])
        SjLog.i("APNs token registered", vars: ["token": token])
        // Messaging.messaging().apnsToken = deviceToken    // FCM 활성화 시
    }

    /// APNs 등록 실패 — 시뮬레이터 / 권한 거부 / 인증서 오류 등.
    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        SjLog.e("APNs register failed", error: error)
    }
}
