package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdCartDto {

    // ── od_cart ──────────────────────────────────────────
    private String cartId;
    private String siteId;
    private String memberId;
    private String sessionKey;
    private String prodId;
    private String skuId;
    private String optItemId1;
    private String optItemId2;
    private Long unitPrice;
    private Integer orderQty;
    private Long itemPrice;
    private String isChecked;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
