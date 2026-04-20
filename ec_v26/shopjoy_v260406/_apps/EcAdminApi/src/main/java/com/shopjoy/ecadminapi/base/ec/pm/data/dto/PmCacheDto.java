package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCacheDto {

    // ── pm_cache ──────────────────────────────────────────
    private String cacheId;
    private String siteId;
    private String memberId;
    private String memberNm;
    private String cacheTypeCd;
    private Long cacheAmt;
    private Long balanceAmt;
    private String refId;
    private String cacheDesc;
    private String procUserId;
    private LocalDateTime cacheDate;
    private LocalDate expireDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
