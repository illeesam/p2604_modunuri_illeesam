package com.shopjoy.bo.push

import com.shopjoy.bo.util.SjLog

/**
 * FCM 메시지 수신 서비스 — Firebase 의존성 활성화 후 실제 구현.
 * (FO 앱의 FcmMessagingService 와 동일 구조)
 */
class FcmMessagingService {

    init {
        SjLog.fn("FcmMessagingService.<init>")
    }

    /**
     * onMessageReceived(message: RemoteMessage) {
     *   SjLog.fn("onMessageReceived",
     *     "from" to message.from, "data" to message.data)
     *   // ...
     * }
     *
     * onNewToken(token: String) {
     *   SjLog.fn("onNewToken", "token" to token)
     *   SjLog.i("FCM new token received — register to backend", "token" to token)
     * }
     */
}
