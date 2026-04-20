package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmChattRoomDto {

    // ── cm_chatt_room ──────────────────────────────────────────
    private String chattRoomId;
    private String siteId;
    private String memberId;
    private String memberNm;
    private String adminUserId;
    private String subject;
    private String chattStatusCd;
    private String chattStatusCdBefore;
    private LocalDateTime lastMsgDate;
    private Integer memberUnreadCnt;
    private Integer adminUnreadCnt;
    private String chattMemo;
    private LocalDateTime closeDate;
    private String closeReason;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
