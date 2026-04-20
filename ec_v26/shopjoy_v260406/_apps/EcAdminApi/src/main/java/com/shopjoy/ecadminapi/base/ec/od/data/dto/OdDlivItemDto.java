package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdDlivItemDto {

    // ── od_dliv_item ──────────────────────────────────────────
    private String dlivItemId;
    private String siteId;
    private String dlivId;
    private String orderItemId;
    private String prodId;
    private String optItemId1;
    private String optItemId2;
    private String dlivTypeCd;
    private Long unitPrice;
    private Integer dlivQty;
    private String dlivItemStatusCd;
    private String dlivItemStatusCdBefore;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
