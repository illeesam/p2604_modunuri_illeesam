package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleAdjDto {

    // ── st_settle_adj ──────────────────────────────────────────
    private String settleAdjId;
    private String settleId;
    private String siteId;
    private String adjTypeCd;
    private Long adjAmt;
    private String adjReason;
    private String settleAdjMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
