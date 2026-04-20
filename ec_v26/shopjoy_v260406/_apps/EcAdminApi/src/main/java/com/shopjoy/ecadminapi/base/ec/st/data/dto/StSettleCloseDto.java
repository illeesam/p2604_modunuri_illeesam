package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleCloseDto {

    // ── st_settle_close ──────────────────────────────────────────
    private String settleCloseId;
    private String settleId;
    private String siteId;
    private String closeStatusCd;
    private String closeReason;
    private Long finalSettleAmt;
    private String closeBy;
    private LocalDateTime closeDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
