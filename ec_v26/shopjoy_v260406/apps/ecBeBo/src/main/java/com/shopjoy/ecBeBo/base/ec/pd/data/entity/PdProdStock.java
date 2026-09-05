package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pd_prod_stock", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("상품 재고 마스터 — prod_stock_id PK, stock_code UNIQUE")
public class PdProdStock extends BaseEntity {

    @Id
    @Comment("재고ID (PK)")
    @Column(name = "prod_stock_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodStockId 는 21자 이내여야 합니다.")
    private String prodStockId;

    @Comment("재고코드 (UNIQUE, 자유 문자열 — 예: SHIRT-RED-M)")
    @Column(name = "stock_code", length = 50, nullable = false, unique = true)
    @Size(max = 50, message = "stockCode 는 50자 이내여야 합니다.")
    private String stockCode;


    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("재고수량")
    @Column(name = "stock_qty", nullable = false)
    private Integer stockQty;

    @Comment("판매수량 (캐싱 — 주문 완료 시 +1)")
    @Column(name = "sale_count", nullable = false)
    private Integer saleCount;

}
