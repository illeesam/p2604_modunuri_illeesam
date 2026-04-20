package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdhDlivChgHistDto {

    // ── odh_dliv_chg_hist ──────────────────────────────────────────
    private String dlivChgHistId;
    private String siteId;
    private String dlivId;
    private String chgTypeCd;
    private String chgField;
    private String beforeVal;
    private String afterVal;
    private String chgReason;
    private String chgUserId;
    private LocalDateTime chgDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
