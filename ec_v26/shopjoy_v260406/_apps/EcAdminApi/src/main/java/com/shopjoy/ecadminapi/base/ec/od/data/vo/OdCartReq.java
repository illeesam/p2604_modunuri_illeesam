package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdCartReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public OdCart toEntity() {
        return OdCart.builder()
                .cartId(cartId)
                .siteId(siteId)
                .memberId(memberId)
                .sessionKey(sessionKey)
                .prodId(prodId)
                .skuId(skuId)
                .optItemId1(optItemId1)
                .optItemId2(optItemId2)
                .unitPrice(unitPrice)
                .orderQty(orderQty)
                .itemPrice(itemPrice)
                .isChecked(isChecked)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
