package com.shopjoy.fo

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.shopjoy.fo.util.SjLog

/**
 * ShopjoyFoApp 의 [Application] 서브클래스.
 *
 * **역할**:
 * - 앱 프로세스 시작 시 1회 호출되는 [onCreate] 에서 전역 초기화.
 * - 빌드/디바이스 정보를 [SjLog.appStart] 로 logcat 에 명시적 출력.
 * - 푸시 알림용 NotificationChannel (Android 8.0+ 필수) 생성.
 *
 * AndroidManifest.xml 의 `<application android:name=".App">` 으로 등록.
 */
class App : Application() {

    /**
     * 앱 프로세스 시작 시 호출되는 라이프사이클 메서드.
     *
     * 호출 순서: 시스템이 가장 먼저 호출 → 모든 ContentProvider/Activity 보다 앞.
     * 여기서 무거운 동기 작업을 수행하면 앱 시작이 느려지므로 가벼운 초기화만 수행.
     */
    override fun onCreate() {
        SjLog.fn()                                    // 함수 진입 로그
        super.onCreate()

        // 앱 시작 시 빌드/환경/디바이스 정보를 명시적으로 logcat 에 출력.
        // 운영 중 사용자가 보낸 로그를 분석할 때 빌드 추적용으로 사용됨.
        SjLog.appStart(mapOf(
            "applicationId" to BuildConfig.APPLICATION_ID,    // 패키지명 (환경 suffix 포함)
            "versionName"   to BuildConfig.VERSION_NAME,      // 사용자 표시 버전 (예: 1.0.0)
            "versionCode"   to BuildConfig.VERSION_CODE,      // 정수 단조 증가 빌드 번호
            "buildType"     to BuildConfig.BUILD_TYPE,        // debug | release
            "flavor"        to BuildConfig.FLAVOR,            // local | dev | prod
            "baseUrl"       to BuildConfig.BASE_URL,          // WebView 가 로드할 운영 URL
            "androidSdk"    to Build.VERSION.SDK_INT,         // OS 버전 (예: 34=Android 14)
            "deviceModel"   to Build.MODEL,                   // 기기 모델 (예: Pixel 7)
            "manufacturer"  to Build.MANUFACTURER             // 제조사 (예: Google)
        ))

        createNotificationChannels()
        SjLog.lifecycle("Application.onCreate.end")
    }

    /**
     * 앱 종료 시 호출 — **에뮬레이터에서만 호출**되며 실제 디바이스에서는 호출되지 않음.
     * 운영 환경에서는 의존하지 말 것 (앱은 보통 OS 가 강제 종료시킴).
     */
    override fun onTerminate() {
        SjLog.fn()
        SjLog.appEnd("Application.onTerminate")
        super.onTerminate()
    }

    /**
     * 시스템 메모리가 매우 부족할 때 호출 (deprecated 지만 일부 OS 에서 여전히 호출됨).
     * 캐시 비우기 등 메모리 회수 작업 가능.
     */
    override fun onLowMemory() {
        SjLog.fn()
        SjLog.w("low memory event")
        super.onLowMemory()
    }

    /**
     * 메모리 압박 단계별 호출.
     *
     * @param level  TRIM_MEMORY_RUNNING_MODERATE / _LOW / _CRITICAL 등 단계 상수.
     *               높을수록 압박 심함. 캐시/이미지 등 단계적 해제 가능.
     */
    override fun onTrimMemory(level: Int) {
        SjLog.fn("onTrimMemory", "level" to level)
        super.onTrimMemory(level)
    }

    /**
     * NotificationChannel 생성 (Android 8.0 / API 26 이상 필수).
     *
     * FCM 푸시가 알림으로 표시될 때 어떤 채널을 사용할지 [AndroidManifest.xml] 의
     * `com.google.firebase.messaging.default_notification_channel_id` 메타데이터로 지정됨.
     */
    private fun createNotificationChannels() {
        SjLog.fn()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // O = Oreo (Android 8.0) — NotificationChannel 도입.
            val nm = getSystemService(NotificationManager::class.java)
            val channelId = "shopjoy_default"           // AndroidManifest 의 메타데이터와 일치 필수.
            val channel = NotificationChannel(
                channelId,
                "ShopJoy 알림",                          // 사용자 설정 화면에 표시되는 채널 이름.
                NotificationManager.IMPORTANCE_DEFAULT  // 기본 중요도 — 소리 + 진동 (사용자 설정 가능).
            ).apply {
                description = "주문/배송/이벤트 알림"     // 사용자 설정에 표시되는 채널 설명.
                enableVibration(true)
            }
            nm.createNotificationChannel(channel)
            SjLog.d("notification channel created", "channelId" to channelId)
        } else {
            SjLog.d("skip channel creation — SDK < O", "sdkInt" to Build.VERSION.SDK_INT)
        }
    }
}
