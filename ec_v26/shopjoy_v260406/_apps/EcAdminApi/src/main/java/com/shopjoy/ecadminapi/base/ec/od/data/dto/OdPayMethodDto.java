package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdPayMethodDto {

    // ── od_pay_method ──────────────────────────────────────────
    private String payMethodId;
    private String memberId;
    private String payMethodTypeCd;
    private String payMethodNm;
    private String payMethodAlias;
    private String payKeyNo;
    private String mainMethodYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
