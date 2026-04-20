package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmChattMsgDto {

    // ── cm_chatt_msg ──────────────────────────────────────────
    private String msgId;
    private String siteId;
    private String chattId;
    private String senderCd;
    private String msgText;
    private String refType;
    private String refId;
    private LocalDateTime sendDate;
    private String readYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
