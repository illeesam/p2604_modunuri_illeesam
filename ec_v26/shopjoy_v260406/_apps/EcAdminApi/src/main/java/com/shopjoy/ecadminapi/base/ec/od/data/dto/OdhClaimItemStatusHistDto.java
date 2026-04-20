package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdhClaimItemStatusHistDto {

    // ── odh_claim_item_status_hist ──────────────────────────────────────────
    private String claimItemStatusHistId;
    private String siteId;
    private String claimItemId;
    private String claimId;
    private String orderItemId;
    private String claimItemStatusCdBefore;
    private String claimItemStatusCd;
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
