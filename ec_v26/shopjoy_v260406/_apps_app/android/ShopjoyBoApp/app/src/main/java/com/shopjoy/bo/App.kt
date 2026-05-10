package com.shopjoy.bo

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.shopjoy.bo.util.SjLog

/**
 * ShopjoyBoApp 의 [Application] 서브클래스 (관리자용).
 *
 * 역할:
 * - 앱 시작 시 빌드/디바이스 정보 logcat 출력
 * - 관리자 알림용 NotificationChannel 생성 (Android 8.0+)
 *
 * @see com.shopjoy.fo.App  FO 앱의 같은 클래스 — 채널 이름/설명만 다름
 */
class App : Application() {

    /** 앱 프로세스 시작 시 1회 호출 — 가벼운 초기화만 수행. */
    override fun onCreate() {
        SjLog.fn()
        super.onCreate()

        // 운영 중 사용자가 보낸 로그를 분석할 때 빌드 추적용으로 명시 출력.
        SjLog.appStart(mapOf(
            "applicationId" to BuildConfig.APPLICATION_ID,    // 패키지명 (환경 suffix 포함)
            "versionName"   to BuildConfig.VERSION_NAME,      // 사용자 표시 버전 (1.0.0)
            "versionCode"   to BuildConfig.VERSION_CODE,      // 정수 단조 증가 빌드 번호
            "buildType"     to BuildConfig.BUILD_TYPE,        // debug | release
            "flavor"        to BuildConfig.FLAVOR,            // local | dev | prod
            "baseUrl"       to BuildConfig.BASE_URL,          // WebView 가 로드할 BO URL
            "androidSdk"    to Build.VERSION.SDK_INT,
            "deviceModel"   to Build.MODEL,
            "manufacturer"  to Build.MANUFACTURER
        ))

        createNotificationChannels()
        SjLog.lifecycle("Application.onCreate.end")
    }

    /** 앱 종료 (에뮬레이터에서만 호출 — 운영 의존 X). */
    override fun onTerminate() {
        SjLog.fn()
        SjLog.appEnd("Application.onTerminate")
        super.onTerminate()
    }

    /** 시스템 메모리 매우 부족. */
    override fun onLowMemory() {
        SjLog.fn()
        SjLog.w("low memory event")
        super.onLowMemory()
    }

    /**
     * 메모리 압박 단계별 호출.
     * @param level  TRIM_MEMORY_* 상수 — 높을수록 압박 심함.
     */
    override fun onTrimMemory(level: Int) {
        SjLog.fn("onTrimMemory", "level" to level)
        super.onTrimMemory(level)
    }

    /**
     * NotificationChannel 생성 (Android 8.0+ 필수).
     * 관리자 알림용 — 주문/클레임/배송 이벤트가 푸시로 도착할 때 사용됨.
     */
    private fun createNotificationChannels() {
        SjLog.fn()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)
            val channelId = "shopjoy_default"
            val channel = NotificationChannel(
                channelId,
                "ShopJoy BO 알림",                            // 사용자 설정 화면에 표시.
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "관리자 알림 (주문/클레임/배송)"
                enableVibration(true)
            }
            nm.createNotificationChannel(channel)
            SjLog.d("notification channel created", "channelId" to channelId)
        } else {
            SjLog.d("skip channel creation — SDK < O", "sdkInt" to Build.VERSION.SDK_INT)
        }
    }
}
