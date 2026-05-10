import Foundation
import os.log

/// ShopjoyFoApp 통합 로그 유틸 (Swift `enum` 으로 namespace 역할).
///
/// **로그 출력 형식**: `[ENV][파일명:라인:함수명] 메시지 — 변수=값`
///
/// **방침**: 모든 로그는 빌드 환경(Debug/Release) 에 관계없이 항상 출력.
/// (사용자 요구사항)
///
/// **사용 예**:
/// ```swift
/// SjLog.fn(["url": url, "isCold": isCold])             // 함수 진입 + 파라미터
/// SjLog.d("결제 시작", vars: ["orderId": orderId])      // 일반 디버그
/// SjLog.webview("loadUrl", url: url)                    // WebView URL 추적
/// SjLog.lifecycle("viewDidLoad")                        // 라이프사이클
/// ```
///
/// **구현 노트**:
/// `enum` 으로 정의하여 인스턴스화 불가능 → static 메서드만 호출.
/// `#file`, `#function`, `#line` 자동 주입을 활용해 호출자 위치 명시.
enum SjLog {

    /// 빌드 환경 식별자 (`SWIFT_ACTIVE_COMPILATION_CONDITIONS` 으로 주입).
    /// - `local`: 호스트 PC Live Server
    /// - `dev`:   Netlify 개발 배포
    /// - `prod`:  Netlify 운영 배포
    private static let env: String = {
        #if ENV_LOCAL
        return "local"
        #elseif ENV_DEV
        return "dev"
        #elseif ENV_PROD
        return "prod"
        #else
        return "unknown"
        #endif
    }()

    /// 함수 진입 로그 — Swift 의 `#file/#function/#line` 자동 주입을 활용.
    ///
    /// - Parameters:
    ///   - vars:     파라미터 / 진입 시점 변수 (`[String: Any?]`).
    ///   - label:    함수명 표시 override (생략 시 `#function` 자동 사용).
    ///   - file:     컴파일러가 자동 주입 — 호출 위치 파일 경로.
    ///   - function: 컴파일러 자동 주입 — 호출 메서드 시그니처.
    ///   - line:     컴파일러 자동 주입 — 호출 라인 번호.
    static func fn(
        _ vars: [String: Any?]? = nil,
        label: String? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: label ?? function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) ENTER\(varStr)")
    }

    /// 일반 디버그 로그 — 함수 내부의 분기 / 주요 변수 출력.
    static func d(
        _ msg: String,
        vars: [String: Any?]? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) \(msg)\(varStr)")
    }

    /// 정보 로그 — 중요 이벤트 (APNs 토큰 / 권한 결과 등).
    /// `NSLog` 사용으로 OS Console 에서도 검색 가능.
    static func i(
        _ msg: String,
        vars: [String: Any?]? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        NSLog("[%@]%@ %@%@", env, frame, msg, varStr)
    }

    /// 경고 로그 — 정상이지만 주의 필요.
    static func w(
        _ msg: String,
        vars: [String: Any?]? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        NSLog("[%@]%@ ⚠️ %@%@", env, frame, msg, varStr)
    }

    /// 에러 로그 — 예외 / 비정상 동작.
    /// - Parameters:
    ///   - error: Swift `Error` 객체. localizedDescription 이 자동으로 출력에 포함됨.
    static func e(
        _ msg: String,
        error: Error? = nil,
        vars: [String: Any?]? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        let errStr = error.map { " — error=\($0.localizedDescription)" } ?? ""
        NSLog("[%@]%@ ❌ %@%@%@", env, frame, msg, errStr, varStr)
    }

    /// WebView URL 추적 — 별도 메서드로 분리해 Console.app 에서 grep 용이.
    /// - Parameters:
    ///   - action: 동작명 (예: `loadUrl`, `decidePolicyFor`, `didFinish`).
    ///   - url:    대상 URL (nil 가능 — `nil` 문자열로 출력).
    static func webview(
        _ action: String,
        url: String?,
        vars: [String: Any?]? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) WEBVIEW.\(action) url=\(url ?? "nil")\(varStr)")
    }

    /// 라이프사이클 이벤트 (App / Scene / ViewController).
    static func lifecycle(
        _ event: String,
        vars: [String: Any?]? = nil,
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) LIFECYCLE.\(event)\(varStr)")
    }

    /// 앱 시작 정보 — `application(_:didFinishLaunchingWithOptions:)` 에서 1회 호출.
    /// 빌드/디바이스 정보를 구분선과 함께 출력 → 운영 로그 분석 시 빌드 추적용.
    static func appStart(_ buildInfo: [String: Any?]) {
        NSLog("════════════════════════════════════════════════════════════════")
        NSLog("[%@] APP START — ShopjoyFoApp", env)
        for (k, v) in buildInfo {
            NSLog("[%@]   %@ = %@", env, k, "\(v ?? "nil")")
        }
        NSLog("════════════════════════════════════════════════════════════════")
    }

    /// 앱 종료 정보 — `applicationWillTerminate` 등에서 호출.
    static func appEnd(_ reason: String) {
        NSLog("[%@] APP END — reason=%@", env, reason)
        NSLog("════════════════════════════════════════════════════════════════")
    }

    // MARK: - Internal Helpers

    /// `[파일명:라인:함수명]` 형식 prefix 생성.
    /// `#file` 의 전체 경로에서 마지막 컴포넌트(파일명) 만 추출.
    private static func formatFrame(file: String, line: Int, function: String) -> String {
        let filename = (file as NSString).lastPathComponent
        return "[\(filename):\(line):\(function)]"
    }

    /// vars dictionary 를 ` — k1=v1, k2=v2` 형식으로 포매팅.
    /// nil 또는 빈 dict 일 경우 빈 문자열 반환.
    private static func formatVars(_ vars: [String: Any?]?) -> String {
        guard let vars = vars, !vars.isEmpty else { return "" }
        let pairs = vars.map { (k, v) -> String in
            "\(k)=\(safeStr(v))"
        }
        return " — " + pairs.joined(separator: ", ")
    }

    /// 값을 문자열로 안전하게 변환 — 200자 초과 시 절단.
    private static func safeStr(_ v: Any?) -> String {
        guard let v = v else { return "nil" }
        let s = "\(v)"
        return s.count > 200 ? String(s.prefix(200)) + "...(truncated)" : s
    }
}
