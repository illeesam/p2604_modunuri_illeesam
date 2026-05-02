package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyAlarmDto {

    // ── sy_alarm ──────────────────────────────────────────────────
    private String alarmId;
    private String siteId;
    private String alarmTitle;
    private String alarmTypeCd;
    private String channelCd;
    private String targetTypeCd;
    private String targetId;
    private String templateId;
    private String alarmMsg;
    private LocalDateTime alarmSendDate;
    private String alarmStatusCd;
    private Integer alarmSendCount;
    private Integer alarmFailCount;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String pathId;

    // ── JOIN: sy_site / sy_code ───────────────────────────────────
    private String siteNm;
    private String alarmTypeCdNm;
    private String channelCdNm;
    private String targetTypeCdNm;
}
