package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "od_cart", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 장바구니 엔티티
@Comment("장바구니")
public class OdCart extends BaseEntity {

    @Id
    @Comment("장바구니ID (YYMMDDhhmmss+rand4)")
    @Column(name = "cart_id", length = 21, nullable = false)
    private String cartId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("회원ID (비회원 NULL)")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("비회원 세션키")
    @Column(name = "session_key", length = 100)
    private String sessionKey;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("SKU ID (pd_prod_sku.sku_id)")
    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Comment("옵션1 값ID (pd_prod_opt_item.opt_item_id, 예: 색상)")
    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Comment("옵션2 값ID (pd_prod_opt_item.opt_item_id, 예: 사이즈)")
    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Comment("단가 (담을 시점 가격)")
    @Column(name = "unit_price")
    private Long unitPrice;

    @Comment("수량")
    @Column(name = "order_qty")
    private Integer orderQty;

    @Comment("소계 (단가 × 수량)")
    @Column(name = "item_price")
    private Long itemPrice;

    @Comment("주문선택여부 Y/N")
    @Column(name = "is_checked", length = 1)
    private String isChecked;

}
