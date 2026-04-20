package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleConfigDto {

    // ── st_settle_config ──────────────────────────────────────────
    private String settleConfigId;
    private String siteId;
    private String vendorId;
    private String categoryId;
    private String settleCycleCd;
    private Integer settleDay;
    private BigDecimal commissionRate;
    private Long minSettleAmt;
    private String settleConfigRemark;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
