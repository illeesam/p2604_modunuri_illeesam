package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleEtcAdjDto {

    // ── st_settle_etc_adj ──────────────────────────────────────────
    private String settleEtcAdjId;
    private String settleId;
    private String siteId;
    private String etcAdjTypeCd;
    private String etcAdjDirCd;
    private Long etcAdjAmt;
    private String etcAdjReason;
    private String settleEtcAdjMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
