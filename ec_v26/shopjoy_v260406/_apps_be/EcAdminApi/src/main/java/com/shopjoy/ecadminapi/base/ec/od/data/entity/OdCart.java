package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "od_cart", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 장바구니 엔티티
public class OdCart extends BaseEntity {

    @Id
    @Column(name = "cart_id", length = 21, nullable = false)
    private String cartId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "session_key", length = 100)
    private String sessionKey;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Column(name = "order_qty")
    private Integer orderQty;

    @Column(name = "item_price")
    private Long itemPrice;

    @Column(name = "is_checked", length = 1)
    private String isChecked;

}
