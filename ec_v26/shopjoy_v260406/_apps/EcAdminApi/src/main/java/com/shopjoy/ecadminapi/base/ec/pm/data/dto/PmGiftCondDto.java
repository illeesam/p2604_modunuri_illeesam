package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmGiftCondDto {

    // ── pm_gift_cond ──────────────────────────────────────────
    private String giftCondId;
    private String giftId;
    private String siteId;
    private String condTypeCd;
    private Long minOrderAmt;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
