// ShopjoyFoApp 통합 로그 유틸 (Flutter / Dart).
//
// 형식: [ENV][파일명:라인:함수명] 메시지 — 변수=값
//
// ⚠️ 모든 로그는 환경(local/dev/prod) 관계없이 항상 콘솔 출력 (사용자 요구사항).
//
// 사용 예:
//   SjLog.fn('loadPage', vars: {'url': url, 'isCold': isCold});
//   SjLog.d('결제 시작', vars: {'orderId': orderId, 'amount': amount});
//   SjLog.webview('loadUrl', url);
//   SjLog.lifecycle('appReady');

import 'package:flutter/foundation.dart';
import 'env.dart';

/// 호출자 stacktrace frame 정보 (file/line/fn).
///
/// `StackTrace.current` 의 텍스트 표현에서 정규식으로 추출.
class _CallerFrame {
  /// 파일명 (path 마지막 컴포넌트).
  final String file;

  /// 라인 번호 (정규식 매치 결과 문자열).
  final String line;

  /// 함수명 (예: `_WebViewScreenState.initState`).
  final String fn;

  const _CallerFrame(this.file, this.line, this.fn);
}

/// ShopjoyFoApp 통합 로그 유틸 — static 메서드만 호출.
///
/// 모든 메서드는 [debugPrint] 사용 — Release 빌드에서도 출력되도록.
/// (Dart 의 `print` 는 Release 에서 일부 환경에서 truncate 될 수 있어
///  [debugPrint] 가 더 안정적.)
class SjLog {

  /// 환경 식별자 (`AppEnv.appEnv` 위임).
  /// 예: 'local', 'dev', 'prod'.
  static String get _env => AppEnv.appEnv;

  /// 함수 진입 로그.
  ///
  /// - [label]: 함수명 표시 override (생략 시 stacktrace 자동).
  /// - [vars]:  파라미터 / 진입 시점 변수.
  static void fn(String? label, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final fnName = label ?? c.fn;
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:$fnName] ENTER$varStr');
  }

  /// 일반 디버그 로그.
  static void d(String msg, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] $msg$varStr');
  }

  /// 정보 로그 — 중요 이벤트 (토큰 발급 / 권한 결과 등).
  static void i(String msg, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] $msg$varStr');
  }

  /// 경고 로그 — 정상이지만 주의 필요.
  static void w(String msg, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] ⚠️ $msg$varStr');
  }

  /// 에러 로그 — 예외 / 비정상.
  ///
  /// - [error]: 예외 객체 (toString 으로 출력).
  /// - [stackTrace]: 별도 stacktrace 문자열로 추가 출력.
  static void e(String msg, {Object? error, StackTrace? stackTrace, Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    final errStr = error != null ? ' — error=${_safeStr(error)}' : '';
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] ❌ $msg$errStr$varStr');
    if (stackTrace != null) {
      debugPrint(stackTrace.toString());
    }
  }

  /// WebView URL 추적 — `WEBVIEW.` prefix 로 grep 가능.
  ///
  /// - [action]: 동작명 (예: 'loadRequest', 'onPageFinished', 'onNavigationRequest').
  static void webview(String action, String? url, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] WEBVIEW.$action url=${_safeStr(url)}$varStr');
  }

  /// 라이프사이클 이벤트 (Widget mount/unmount, App state change).
  static void lifecycle(String event, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] LIFECYCLE.$event$varStr');
  }

  /// 앱 시작 정보 — `main()` 에서 1회 호출.
  ///
  /// 빌드 모드 (kReleaseMode/kDebugMode) 도 함께 출력 — 운영 추적용.
  static void appStart({Map<String, Object?>? extra}) {
    debugPrint('════════════════════════════════════════════════════════════════');
    debugPrint('[$_env] APP START — ShopjoyFoApp');
    final info = <String, Object?>{
      'APP_ENV': _env,
      'APP_NAME': AppEnv.appName,
      'BASE_URL': AppEnv.baseUrl,
      'kReleaseMode': kReleaseMode,    // Flutter 빌드 모드.
      'kDebugMode': kDebugMode,
      ...(extra ?? {}),
    };
    info.forEach((k, v) {
      debugPrint('[$_env]   $k = ${_safeStr(v)}');
    });
    debugPrint('════════════════════════════════════════════════════════════════');
  }

  /// 앱 종료 정보 — onTerminate / 의도적 종료 시.
  static void appEnd(String reason) {
    debugPrint('[$_env] APP END — reason=$reason');
    debugPrint('════════════════════════════════════════════════════════════════');
  }

  // ───── 내부 ─────

  /// 호출자 stacktrace frame 추출.
  ///
  /// Dart stack 형식:
  ///   `#0  funcName (package:foo/bar.dart:42:10)`
  ///
  /// @param depth  공개 메서드 깊이 (보통 2).
  static _CallerFrame _caller(int depth) {
    try {
      final trace = StackTrace.current.toString().split('\n');
      // [0]=_caller, [1]=공개 메서드 (fn/d/etc), [2]=실제 호출자 (앱 코드).
      final line = trace.length > depth ? trace[depth] : trace.last;
      // `#N  funcName (path:line:col)` 매치.
      final m = RegExp(r'#\d+\s+(\S+)\s+\((.+):(\d+):\d+\)').firstMatch(line);
      if (m == null) return const _CallerFrame('?', '?', '?');
      final fnName = m.group(1) ?? '?';
      final url = m.group(2) ?? '';
      // path 마지막 컴포넌트 + query 제거.
      final fileName = url.split(RegExp(r'[/\\]')).last.split('?').first;
      return _CallerFrame(fileName, m.group(3) ?? '?', fnName);
    } catch (_) {
      return const _CallerFrame('?', '?', '?');
    }
  }

  /// 값을 안전한 문자열로 — 200자 절단.
  static String _safeStr(Object? v) {
    if (v == null) return 'null';
    final s = v.toString();
    return s.length > 200 ? '${s.substring(0, 200)}...(truncated)' : s;
  }

  /// vars Map → ` — k1=v1, k2=v2` 형식.
  static String _formatVars(Map<String, Object?>? vars) {
    if (vars == null || vars.isEmpty) return '';
    final pairs = vars.entries.map((e) => '${e.key}=${_safeStr(e.value)}').join(', ');
    return ' — $pairs';
  }
}
