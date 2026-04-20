package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmSaveUsageDto {

    // ── pm_save_usage ──────────────────────────────────────────
    private String saveUsageId;
    private String siteId;
    private String memberId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private Long useAmt;
    private Long balanceAmt;
    private LocalDateTime usedDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
