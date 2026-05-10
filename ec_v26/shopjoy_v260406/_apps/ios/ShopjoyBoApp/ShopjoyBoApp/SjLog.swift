import Foundation
import os.log

/// ShopjoyBoApp 통합 로그 유틸 (FO 와 동일 인터페이스).
///
/// **로그 출력 형식**: `[ENV][파일명:라인:함수명] 메시지 — 변수=값`
/// **방침**: 모든 로그는 빌드 환경 관계없이 항상 출력.
///
/// @see ShopjoyFoApp.SjLog  FO 의 같은 유틸 — 자세한 주석은 거기 참조
enum SjLog {

    /// 빌드 환경 식별자 (`SWIFT_ACTIVE_COMPILATION_CONDITIONS` 으로 주입).
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

    /// 함수 진입 로그.
    /// - Parameters:
    ///   - vars:     파라미터 / 진입 시점 변수.
    ///   - label:    함수명 표시 override (생략 시 #function 자동).
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

    /// 일반 디버그 로그.
    static func d(
        _ msg: String, vars: [String: Any?]? = nil,
        file: String = #file, function: String = #function, line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) \(msg)\(varStr)")
    }

    /// 정보 로그 — Console.app 검색용 NSLog.
    static func i(
        _ msg: String, vars: [String: Any?]? = nil,
        file: String = #file, function: String = #function, line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        NSLog("[%@]%@ %@%@", env, frame, msg, varStr)
    }

    /// 경고 로그.
    static func w(
        _ msg: String, vars: [String: Any?]? = nil,
        file: String = #file, function: String = #function, line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        NSLog("[%@]%@ ⚠️ %@%@", env, frame, msg, varStr)
    }

    /// 에러 로그.
    /// - Parameter error: Swift Error 객체. localizedDescription 자동 출력.
    static func e(
        _ msg: String, error: Error? = nil, vars: [String: Any?]? = nil,
        file: String = #file, function: String = #function, line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        let errStr = error.map { " — error=\($0.localizedDescription)" } ?? ""
        NSLog("[%@]%@ ❌ %@%@%@", env, frame, msg, errStr, varStr)
    }

    /// WebView URL 추적.
    static func webview(
        _ action: String, url: String?, vars: [String: Any?]? = nil,
        file: String = #file, function: String = #function, line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) WEBVIEW.\(action) url=\(url ?? "nil")\(varStr)")
    }

    /// 라이프사이클 이벤트.
    static func lifecycle(
        _ event: String, vars: [String: Any?]? = nil,
        file: String = #file, function: String = #function, line: Int = #line
    ) {
        let frame = formatFrame(file: file, line: line, function: function)
        let varStr = formatVars(vars)
        print("[\(env)]\(frame) LIFECYCLE.\(event)\(varStr)")
    }

    /// 앱 시작 정보 — 빌드/디바이스 정보 구분선과 함께 출력.
    static func appStart(_ buildInfo: [String: Any?]) {
        NSLog("════════════════════════════════════════════════════════════════")
        NSLog("[%@] APP START — ShopjoyBoApp", env)
        for (k, v) in buildInfo {
            NSLog("[%@]   %@ = %@", env, k, "\(v ?? "nil")")
        }
        NSLog("════════════════════════════════════════════════════════════════")
    }

    /// 앱 종료 정보.
    static func appEnd(_ reason: String) {
        NSLog("[%@] APP END — reason=%@", env, reason)
        NSLog("════════════════════════════════════════════════════════════════")
    }

    // MARK: - Internal

    /// `[파일명:라인:함수명]` prefix 생성.
    private static func formatFrame(file: String, line: Int, function: String) -> String {
        let filename = (file as NSString).lastPathComponent
        return "[\(filename):\(line):\(function)]"
    }

    /// vars dictionary 포매팅.
    private static func formatVars(_ vars: [String: Any?]?) -> String {
        guard let vars = vars, !vars.isEmpty else { return "" }
        let pairs = vars.map { (k, v) -> String in
            "\(k)=\(safeStr(v))"
        }
        return " — " + pairs.joined(separator: ", ")
    }

    /// 200자 초과 절단.
    private static func safeStr(_ v: Any?) -> String {
        guard let v = v else { return "nil" }
        let s = "\(v)"
        return s.count > 200 ? String(s.prefix(200)) + "...(truncated)" : s
    }
}
