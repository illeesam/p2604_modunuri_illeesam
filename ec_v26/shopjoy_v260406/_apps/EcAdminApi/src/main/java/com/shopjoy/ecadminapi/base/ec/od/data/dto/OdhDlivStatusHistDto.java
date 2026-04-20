package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdhDlivStatusHistDto {

    // ── odh_dliv_status_hist ──────────────────────────────────────────
    private String dlivStatusHistId;
    private String siteId;
    private String dlivId;
    private String orderId;
    private String dlivStatusCdBefore;
    private String dlivStatusCd;
    private String statusReason;
    private String chgUserId;
    private LocalDateTime chgDate;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
