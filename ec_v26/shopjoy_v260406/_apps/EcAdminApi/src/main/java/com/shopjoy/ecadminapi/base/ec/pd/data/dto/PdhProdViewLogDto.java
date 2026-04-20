package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdhProdViewLogDto {

    // ── pdh_prod_view_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String memberId;
    private String sessionKey;
    private String prodId;
    private String refId;
    private String refNm;
    private String searchKw;
    private String ip;
    private String device;
    private String referrer;
    private LocalDateTime viewDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
