package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settleItemId;
    private String settleId;
    private String siteId;
    private String orderId;
    private String orderItemId;
    private String vendorId;
    private String prodId;
    private String settleItemTypeCd;
    private LocalDateTime orderDate;
    private Integer orderQty;
    private Long unitPrice;
    private Long itemPrice;
    private Long discntAmt;
    private BigDecimal commissionRate;
    private Long commissionAmt;
    private Long settleItemAmt;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public StSettleItem toEntity() {
        return StSettleItem.builder()
                .settleItemId(settleItemId)
                .settleId(settleId)
                .siteId(siteId)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .vendorId(vendorId)
                .prodId(prodId)
                .settleItemTypeCd(settleItemTypeCd)
                .orderDate(orderDate)
                .orderQty(orderQty)
                .unitPrice(unitPrice)
                .itemPrice(itemPrice)
                .discntAmt(discntAmt)
                .commissionRate(commissionRate)
                .commissionAmt(commissionAmt)
                .settleItemAmt(settleItemAmt)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
