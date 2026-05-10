package com.shopjoy.fo.util

import android.util.Log
import com.shopjoy.fo.BuildConfig

/**
 * ShopjoyFoApp 통합 로그 유틸 객체.
 *
 * **로그 출력 형식**: `[ENV][파일명:라인:함수명] 메시지 — 변수=값`
 *
 * **방침**: 사용자 요구사항에 따라 모든 로그는 빌드 환경(Debug/Release) 에 관계없이
 * 항상 logcat 에 출력됩니다. (ProGuard 규칙도 SjLog 클래스 유지로 설정됨)
 *
 * **사용 예**:
 * ```kotlin
 * SjLog.fn("loadUrl", "url" to url, "isCold" to isCold)   // 함수 진입 + 파라미터
 * SjLog.d("결제 시작", "orderId" to orderId)               // 일반 디버그
 * SjLog.webview("loadUrl", url)                            // WebView URL 추적 강조
 * SjLog.lifecycle("onCreate")                              // 라이프사이클 이벤트
 * SjLog.appStart(mapOf("ver" to "1.0.0"))                  // 앱 시작 (구분선 + 빌드 정보)
 * ```
 *
 * @see BuildConfig.DEBUG    빌드 타입 (debug / release)
 * @see BuildConfig.FLAVOR   환경 구분 (local / dev / prod)
 */
object SjLog {

    /** logcat TAG — Android Studio 의 Logcat 필터에서 "ShopjoyFo" 로 필터링 가능. */
    private const val TAG = "ShopjoyFo"

    /**
     * 환경 식별자. logcat 출력 prefix 로 사용.
     * 형식: `{buildType}/{flavor}` (예: `debug/local`, `release/prod`)
     */
    private val ENV: String = BuildConfig.BUILD_TYPE + "/" + BuildConfig.FLAVOR

    /**
     * 함수 진입 로그.
     *
     * 호출 위치(파일/라인/함수명)를 stacktrace 에서 자동 추출하여
     * `[ENV][파일명:라인:함수명] ENTER — k1=v1, k2=v2` 형식으로 logcat 에 출력.
     *
     * @param label  표시할 함수명 (생략 시 stacktrace 의 메서드명 사용).
     *               람다 / 익명 함수처럼 자동 추출이 부정확할 때 명시.
     * @param vars   파라미터 또는 진입 시점의 주요 변수 (key to value 페어).
     */
    @JvmStatic
    fun fn(label: String? = null, vararg vars: Pair<String, Any?>) {
        // 호출 스택 [0]=getStackTrace, [1]=caller(), [2]=fn(), [3]=실제 호출자
        val frame = caller(2)
        val varStr = formatVars(vars)
        val fnName = label ?: frame.methodName
        Log.d(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:$fnName] ENTER$varStr")
    }

    /**
     * 일반 디버그 로그 — 함수 내부의 분기/변수 강조 시.
     *
     * @param msg   본문 메시지.
     * @param vars  본문에 부속된 변수들 (key to value 페어).
     */
    @JvmStatic
    fun d(msg: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.d(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr")
    }

    /**
     * 정보 로그 — Release 환경에서도 보존되어야 하는 중요한 이벤트.
     * (예: APNs 토큰 발급, 권한 결과, 주요 상태 전환)
     */
    @JvmStatic
    fun i(msg: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.i(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr")
    }

    /**
     * 경고 로그 — 정상 동작이지만 주의 필요한 상황.
     * (예: 캐스팅 실패 / 권한 거부 / 빈 응답)
     */
    @JvmStatic
    fun w(msg: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.w(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr")
    }

    /**
     * 에러 로그 — 비정상 동작 / 예외 발생 시.
     *
     * @param msg   에러 메시지.
     * @param t     예외 객체 (stacktrace 가 logcat 에 자동 출력됨).
     * @param vars  컨텍스트 변수.
     */
    @JvmStatic
    fun e(msg: String, t: Throwable? = null, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.e(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr", t)
    }

    /**
     * WebView URL 로딩 추적 — 별도 메서드로 분리하여 logcat 에서 grep 용이.
     *
     * 사용자 요구사항: WebView 호출 시 URL 정보 명시 출력.
     *
     * @param action  동작명 (예: `loadUrl`, `shouldOverrideUrlLoading`, `onPageFinished`).
     * @param url     로딩 / 처리 대상 URL (null 가능).
     * @param vars    부속 정보 (HTTP method, 응답 코드 등).
     */
    @JvmStatic
    fun webview(action: String, url: String?, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.d(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] WEBVIEW.$action url=$url$varStr")
    }

    /**
     * 라이프사이클 이벤트 (Application / Activity / Fragment / Scene).
     * logcat 에서 `LIFECYCLE.` prefix 로 grep 가능.
     */
    @JvmStatic
    fun lifecycle(event: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.i(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] LIFECYCLE.$event$varStr")
    }

    /**
     * 앱 시작 정보 출력 — Application.onCreate 에서 1회 호출.
     *
     * 빌드 정보(applicationId, versionName, versionCode 등) 와 디바이스 정보를
     * 구분선과 함께 logcat 에 명시적으로 남겨 운영 중 문제 발생 시 빌드 추적 가능하게 함.
     */
    @JvmStatic
    fun appStart(buildInfo: Map<String, Any?>) {
        Log.i(TAG, "════════════════════════════════════════════════════════════════")
        Log.i(TAG, "[$ENV] APP START — ShopjoyFoApp")
        buildInfo.forEach { (k, v) -> Log.i(TAG, "[$ENV]   $k = $v") }
        Log.i(TAG, "════════════════════════════════════════════════════════════════")
    }

    /**
     * 앱 종료 정보 — Application.onTerminate 또는 의도적 종료 시 호출.
     *
     * @param reason  종료 사유 (예: `onTerminate`, `userExit`, `crash`).
     */
    @JvmStatic
    fun appEnd(reason: String) {
        Log.i(TAG, "[$ENV] APP END — reason=$reason")
        Log.i(TAG, "════════════════════════════════════════════════════════════════")
    }

    // ───────── 내부 유틸 ─────────

    /**
     * 호출자의 stacktrace frame 추출.
     *
     * @param depth  공개 메서드(fn/d/i/w/e/webview 등) 의 현재 깊이.
     *               getStackTrace + caller 자체를 보정하여 실제 호출자(앱 코드) frame 반환.
     */
    private fun caller(depth: Int): StackTraceElement {
        // [0]=getStackTrace, [1]=caller(), [2]=공개 메서드, [3]=실제 호출자(앱 코드)
        val trace = Thread.currentThread().stackTrace
        return trace.getOrNull(depth + 1) ?: trace.last()
    }

    /**
     * varargs Pair 배열을 ` — k1=v1, k2=v2` 형식 문자열로 포매팅.
     *
     * @return  비어있을 경우 빈 문자열 (logcat 출력에 영향 없음).
     */
    private fun formatVars(vars: Array<out Pair<String, Any?>>): String {
        if (vars.isEmpty()) return ""
        val sb = StringBuilder(" — ")
        vars.forEachIndexed { i, (k, v) ->
            if (i > 0) sb.append(", ")
            sb.append(k).append("=").append(safeStr(v))
        }
        return sb.toString()
    }

    /**
     * 값을 안전하게 문자열로 변환.
     * 매우 긴 값 (200자 초과) 은 절단하여 logcat 한 줄 폭이 폭주하지 않도록 함.
     */
    private fun safeStr(v: Any?): String {
        if (v == null) return "null"
        val s = v.toString()
        return if (s.length > 200) s.take(200) + "...(truncated)" else s
    }
}
