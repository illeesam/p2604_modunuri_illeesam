package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdDlivTmpltDto {

    // ── pd_dliv_tmplt ──────────────────────────────────────────
    private String dlivTmpltId;
    private String siteId;
    private String vendorId;
    private String dlivTmpltNm;
    private String dlivMethodCd;
    private String dlivPayTypeCd;
    private String dlivCourierCd;
    private Long dlivCost;
    private Long freeDlivMinAmt;
    private Long islandExtraCost;
    private Long returnCost;
    private Long exchangeCost;
    private String returnCourierCd;
    private String returnAddrZip;
    private String returnAddr;
    private String returnAddrDetail;
    private String returnTelNo;
    private String baseDlivYn;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
