package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhSendMsgLogDto {

    // ── syh_send_msg_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String channelCd;
    private String templateId;
    private String templateCode;
    private String memberId;
    private String userId;
    private String recvPhone;
    private String deviceToken;
    private String senderPhone;
    private String title;
    private String content;
    private String params;
    private String kakaoTplCode;
    private String resultCd;
    private String resultMsg;
    private String failReason;
    private LocalDateTime sendDate;
    private String refTypeCd;
    private String refId;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
