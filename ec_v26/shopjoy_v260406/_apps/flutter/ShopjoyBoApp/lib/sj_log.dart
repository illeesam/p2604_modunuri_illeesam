// ShopjoyBoApp 통합 로그 유틸 (Flutter / Dart, FO 와 동일 인터페이스).
//
// 형식: [ENV][파일명:라인:함수명] 메시지 — 변수=값
// ⚠️ 모든 로그는 환경 관계없이 항상 콘솔 출력.
//
// @see ShopjoyFoApp/lib/sj_log.dart  FO 의 같은 파일 — 자세한 주석은 거기 참조

import 'package:flutter/foundation.dart';
import 'env.dart';

/// 호출자 stacktrace frame.
class _CallerFrame {
  /// 파일명.
  final String file;

  /// 라인 번호 (문자열).
  final String line;

  /// 함수명.
  final String fn;

  const _CallerFrame(this.file, this.line, this.fn);
}

/// ShopjoyBoApp 의 통합 로그 유틸 — static 메서드만.
class SjLog {

  /// 환경 식별자 (`AppEnv.appEnv` 위임).
  static String get _env => AppEnv.appEnv;

  /// 함수 진입.
  static void fn(String? label, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final fnName = label ?? c.fn;
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:$fnName] ENTER$varStr');
  }

  /// 디버그.
  static void d(String msg, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] $msg$varStr');
  }

  /// 정보.
  static void i(String msg, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] $msg$varStr');
  }

  /// 경고.
  static void w(String msg, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] ⚠️ $msg$varStr');
  }

  /// 에러 — 예외 객체 + 별도 stacktrace 출력.
  static void e(String msg, {Object? error, StackTrace? stackTrace, Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    final errStr = error != null ? ' — error=${_safeStr(error)}' : '';
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] ❌ $msg$errStr$varStr');
    if (stackTrace != null) {
      debugPrint(stackTrace.toString());
    }
  }

  /// WebView URL 추적.
  static void webview(String action, String? url, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] WEBVIEW.$action url=${_safeStr(url)}$varStr');
  }

  /// 라이프사이클 이벤트.
  static void lifecycle(String event, {Map<String, Object?>? vars}) {
    final c = _caller(2);
    final varStr = _formatVars(vars);
    debugPrint('[$_env][${c.file}:${c.line}:${c.fn}] LIFECYCLE.$event$varStr');
  }

  /// 앱 시작 정보.
  static void appStart({Map<String, Object?>? extra}) {
    debugPrint('════════════════════════════════════════════════════════════════');
    debugPrint('[$_env] APP START — ShopjoyBoApp');
    final info = <String, Object?>{
      'APP_ENV': _env,
      'APP_NAME': AppEnv.appName,
      'BASE_URL': AppEnv.baseUrl,
      'kReleaseMode': kReleaseMode,
      'kDebugMode': kDebugMode,
      ...(extra ?? {}),
    };
    info.forEach((k, v) {
      debugPrint('[$_env]   $k = ${_safeStr(v)}');
    });
    debugPrint('════════════════════════════════════════════════════════════════');
  }

  /// 앱 종료 정보.
  static void appEnd(String reason) {
    debugPrint('[$_env] APP END — reason=$reason');
    debugPrint('════════════════════════════════════════════════════════════════');
  }

  // ───── 내부 ─────

  /// 호출자 stacktrace frame 추출.
  ///
  /// Dart stack 형식: `#N  funcName (path:line:col)`
  static _CallerFrame _caller(int depth) {
    try {
      final trace = StackTrace.current.toString().split('\n');
      final line = trace.length > depth ? trace[depth] : trace.last;
      final m = RegExp(r'#\d+\s+(\S+)\s+\((.+):(\d+):\d+\)').firstMatch(line);
      if (m == null) return const _CallerFrame('?', '?', '?');
      final fnName = m.group(1) ?? '?';
      final url = m.group(2) ?? '';
      final fileName = url.split(RegExp(r'[/\\]')).last.split('?').first;
      return _CallerFrame(fileName, m.group(3) ?? '?', fnName);
    } catch (_) {
      return const _CallerFrame('?', '?', '?');
    }
  }

  /// 200자 초과 절단.
  static String _safeStr(Object? v) {
    if (v == null) return 'null';
    final s = v.toString();
    return s.length > 200 ? '${s.substring(0, 200)}...(truncated)' : s;
  }

  /// vars Map → ` — k=v` 형식.
  static String _formatVars(Map<String, Object?>? vars) {
    if (vars == null || vars.isEmpty) return '';
    final pairs = vars.entries.map((e) => '${e.key}=${_safeStr(e.value)}').join(', ');
    return ' — $pairs';
  }
}
