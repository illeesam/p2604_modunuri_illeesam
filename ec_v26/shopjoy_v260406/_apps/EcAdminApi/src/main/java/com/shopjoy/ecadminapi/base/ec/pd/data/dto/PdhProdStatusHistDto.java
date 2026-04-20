package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdhProdStatusHistDto {

    // ── pdh_prod_status_hist ──────────────────────────────────────────
    private String prodStatusHistId;
    private String siteId;
    private String prodId;
    private String beforeStatusCd;
    private String afterStatusCd;
    private String memo;
    private String procUserId;
    private LocalDateTime procDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
