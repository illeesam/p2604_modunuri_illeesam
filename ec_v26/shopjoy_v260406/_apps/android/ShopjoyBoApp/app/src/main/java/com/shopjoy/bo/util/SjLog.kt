package com.shopjoy.bo.util

import android.util.Log
import com.shopjoy.bo.BuildConfig

/**
 * ShopjoyBoApp 통합 로그 유틸 (FO 와 동일 인터페이스).
 *
 * **로그 출력 형식**: `[ENV][파일명:라인:함수명] 메시지 — 변수=값`
 *
 * **방침**: 모든 로그는 빌드 환경(Debug/Release) 에 관계없이 항상 logcat 출력.
 *
 * @see com.shopjoy.fo.util.SjLog  FO 앱의 같은 유틸 — 시그니처/동작 동일
 */
object SjLog {

    /** logcat TAG — Logcat 필터에서 "ShopjoyBo" 로 BO 앱 로그만 추출. */
    private const val TAG = "ShopjoyBo"

    /** 환경 식별자: `{buildType}/{flavor}`. */
    private val ENV: String = BuildConfig.BUILD_TYPE + "/" + BuildConfig.FLAVOR

    /**
     * 함수 진입 로그.
     * @param label  함수명 표시 override.
     * @param vars   파라미터 / 진입 시점 주요 변수.
     */
    @JvmStatic
    fun fn(label: String? = null, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        val fnName = label ?: frame.methodName
        Log.d(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:$fnName] ENTER$varStr")
    }

    /** 일반 디버그 로그. */
    @JvmStatic
    fun d(msg: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.d(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr")
    }

    /** 정보 로그 — 중요 이벤트. */
    @JvmStatic
    fun i(msg: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.i(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr")
    }

    /** 경고 로그. */
    @JvmStatic
    fun w(msg: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.w(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr")
    }

    /**
     * 에러 로그.
     * @param t  예외 객체 (stacktrace 가 logcat 에 자동 출력).
     */
    @JvmStatic
    fun e(msg: String, t: Throwable? = null, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.e(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] $msg$varStr", t)
    }

    /** WebView URL 추적 — `WEBVIEW.` prefix grep 가능. */
    @JvmStatic
    fun webview(action: String, url: String?, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.d(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] WEBVIEW.$action url=$url$varStr")
    }

    /** 라이프사이클 이벤트. */
    @JvmStatic
    fun lifecycle(event: String, vararg vars: Pair<String, Any?>) {
        val frame = caller(2)
        val varStr = formatVars(vars)
        Log.i(TAG, "[$ENV][${frame.fileName}:${frame.lineNumber}:${frame.methodName}] LIFECYCLE.$event$varStr")
    }

    /** 앱 시작 정보. */
    @JvmStatic
    fun appStart(buildInfo: Map<String, Any?>) {
        Log.i(TAG, "════════════════════════════════════════════════════════════════")
        Log.i(TAG, "[$ENV] APP START — ShopjoyBoApp")
        buildInfo.forEach { (k, v) -> Log.i(TAG, "[$ENV]   $k = $v") }
        Log.i(TAG, "════════════════════════════════════════════════════════════════")
    }

    /** 앱 종료 정보. */
    @JvmStatic
    fun appEnd(reason: String) {
        Log.i(TAG, "[$ENV] APP END — reason=$reason")
        Log.i(TAG, "════════════════════════════════════════════════════════════════")
    }

    /** 호출자 stacktrace frame 추출. */
    private fun caller(depth: Int): StackTraceElement {
        val trace = Thread.currentThread().stackTrace
        return trace.getOrNull(depth + 1) ?: trace.last()
    }

    /** vars 배열 포매팅. */
    private fun formatVars(vars: Array<out Pair<String, Any?>>): String {
        if (vars.isEmpty()) return ""
        val sb = StringBuilder(" — ")
        vars.forEachIndexed { i, (k, v) ->
            if (i > 0) sb.append(", ")
            sb.append(k).append("=").append(safeStr(v))
        }
        return sb.toString()
    }

    /** 200자 초과 값 절단. */
    private fun safeStr(v: Any?): String {
        if (v == null) return "null"
        val s = v.toString()
        return if (s.length > 200) s.take(200) + "...(truncated)" else s
    }
}
