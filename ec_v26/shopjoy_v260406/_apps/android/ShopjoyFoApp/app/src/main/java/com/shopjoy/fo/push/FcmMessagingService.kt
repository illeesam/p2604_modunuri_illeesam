package com.shopjoy.fo.push

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.shopjoy.fo.MainActivity
import com.shopjoy.fo.R
import com.shopjoy.fo.util.SjLog

/**
 * FCM 메시지 수신 서비스 — Firebase 의존성 활성화 후 실제 동작.
 *
 * **활성화 단계**:
 * 1. `app/build.gradle.kts` 의 `firebase-messaging-ktx` 의존성 라인 주석 해제
 * 2. `com.google.gms.google-services` 플러그인 적용 (이미 plugins {} 에 준비됨)
 * 3. `google-services.json` 을 `app/` 폴더에 배치
 * 4. 본 클래스가 `FirebaseMessagingService` 를 상속하도록 변경 (현재는 placeholder)
 * 5. AndroidManifest.xml 의 `<service ...intent-filter MESSAGING_EVENT>` 가 본 클래스를 가리킴
 *
 * **활성화 시 구현해야 하는 메서드**:
 * - `onMessageReceived(message: RemoteMessage)` — 포그라운드/백그라운드 메시지 수신
 * - `onNewToken(token: String)` — FCM 토큰 발급/갱신 시 백엔드에 등록
 *
 * 자세한 구현 예시는 클래스 내부 주석 참조.
 */
class FcmMessagingService /*: FirebaseMessagingService()*/ {

    /*
    // ───────── Firebase 활성화 후 실제 구현 ─────────
    //
    // override fun onMessageReceived(message: RemoteMessage) {
    //     SjLog.fn("onMessageReceived",
    //         "from" to message.from,
    //         "messageId" to message.messageId,
    //         "data" to message.data,
    //         "title" to message.notification?.title,
    //         "body"  to message.notification?.body)
    //     showNotification(this,
    //         title  = message.notification?.title ?: message.data["title"] ?: "ShopJoy",
    //         body   = message.notification?.body  ?: message.data["body"]  ?: "",
    //         pageId = message.data["pageId"],     // 푸시 탭 시 이동할 SPA 라우트
    //         dtlId  = message.data["dtlId"])      // 상세 ID
    // }
    //
    // override fun onNewToken(token: String) {
    //     SjLog.fn("onNewToken", "token" to token)
    //     SjLog.i("FCM new token received — register to backend", "token" to token)
    //     // TODO: 백엔드 /fo/my/device-token 엔드포인트에 토큰 등록 호출
    // }
    */

    /**
     * 알림 빌드 + 게시 — 푸시 메시지를 실제 시스템 알림으로 표시.
     *
     * **PendingIntent 흐름**:
     * 1. 알림 탭 → MainActivity 가 [Intent.FLAG_ACTIVITY_CLEAR_TOP] 로 재포커스
     * 2. extras 의 pageId / dtlId 를 MainActivity 가 WebView JS 로 전달
     * 3. 웹 SPA 라우터가 해당 페이지로 이동
     *
     * @param ctx     알림 게시 Context (FirebaseMessagingService 자신).
     * @param title   알림 제목 (예: "주문 접수 완료").
     * @param body    알림 본문 (예: "주문번호 1001 가 접수되었습니다.").
     * @param pageId  탭 시 이동할 SPA 페이지 ID (예: "myOrder").
     * @param dtlId   상세 화면 ID (예: 주문 ID).
     */
    fun showNotification(
        ctx: Context,
        title: String,
        body: String,
        pageId: String?,
        dtlId: String?
    ) {
        SjLog.fn("showNotification",
            "title" to title, "body" to body, "pageId" to pageId, "dtlId" to dtlId)

        // 알림 탭 시 실행할 Intent — 이미 실행 중이면 onNewIntent 로 받음.
        val intent = Intent(ctx, MainActivity::class.java).apply {
            // CLEAR_TOP: 스택 위 다른 Activity 제거 후 MainActivity 를 최상위로.
            // SINGLE_TOP: 같은 Activity 인스턴스 재사용 (중복 생성 방지).
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            pageId?.let { putExtra("pageId", it) }
            dtlId?.let { putExtra("dtlId", it) }
        }
        SjLog.d("notification intent prepared",
            "flags" to intent.flags, "extras" to intent.extras?.toString())

        // requestCode = 0 — 같은 알림 채널 내에서는 같은 PendingIntent 재사용.
        // FLAG_IMMUTABLE: Android 12+ 필수 (외부 앱이 PendingIntent 변조 방지).
        val pi = PendingIntent.getActivity(
            ctx, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val noti = NotificationCompat.Builder(ctx, "shopjoy_default")  // App.kt 에서 만든 채널 ID.
            .setSmallIcon(R.mipmap.ic_launcher)        // 상태바 아이콘 (단색 권장).
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pi)                       // 탭 시 실행할 Intent.
            .setAutoCancel(true)                        // 탭 후 알림 자동 제거.
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        // notiId — 중복 알림 구분용. timestamp 사용으로 항상 unique.
        val notiId = (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
        nm.notify(notiId, noti)
        SjLog.i("notification posted", "notiId" to notiId, "title" to title)
    }
}
