package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdhPayChgHistDto {

    // ── odh_pay_chg_hist ──────────────────────────────────────────
    private String payChgHistId;
    private String siteId;
    private String payId;
    private String orderId;
    private String payStatusCdBefore;
    private String payStatusCdAfter;
    private String chgTypeCd;
    private String chgReason;
    private String pgResponse;
    private Long refundAmt;
    private String refundPgTid;
    private String chgUserId;
    private LocalDateTime chgDate;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
