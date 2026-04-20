package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdhProdContentChgHistDto {

    // ── pdh_prod_content_chg_hist ──────────────────────────────────────────
    private String histId;
    private String siteId;
    private String prodId;
    private String prodContentId;
    private String contentTypeCd;
    private String contentBefore;
    private String contentAfter;
    private String chgReason;
    private String chgUserId;
    private LocalDateTime chgDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
