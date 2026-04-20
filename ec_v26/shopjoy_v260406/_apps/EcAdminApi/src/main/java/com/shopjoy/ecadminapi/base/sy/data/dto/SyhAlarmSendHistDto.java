package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhAlarmSendHistDto {

    // ── syh_alarm_send_hist ──────────────────────────────────────────
    private String sendHistId;
    private String siteId;
    private String alarmId;
    private String memberId;
    private String channel;
    private String sendTo;
    private LocalDateTime sendDate;
    private String sendHistStatusCd;
    private String errorMsg;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
