package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StReconDto {

    // ── st_recon ──────────────────────────────────────────
    private String reconId;
    private String siteId;
    private String vendorId;
    private String reconTypeCd;
    private String reconStatusCd;
    private String reconStatusCdBefore;
    private String settleId;
    private String settleRawId;
    private String refId;
    private String refNo;
    private String settlePeriod;
    private Long expectedAmt;
    private Long actualAmt;
    private Long diffAmt;
    private String reconNote;
    private String resolvedBy;
    private LocalDateTime resolvedDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
