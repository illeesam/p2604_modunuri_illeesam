package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleDto {

    // ── st_settle ──────────────────────────────────────────
    private String settleId;
    private String siteId;
    private String vendorId;
    private String settleYm;
    private LocalDateTime settleStartDate;
    private LocalDateTime settleEndDate;
    private Long totalOrderAmt;
    private Long totalReturnAmt;
    private Integer totalClaimCnt;
    private Long totalDiscntAmt;
    private BigDecimal commissionRate;
    private Long commissionAmt;
    private Long settleAmt;
    private Long adjAmt;
    private Long etcAdjAmt;
    private Long finalSettleAmt;
    private String settleStatusCd;
    private String settleStatusCdBefore;
    private String settleMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
