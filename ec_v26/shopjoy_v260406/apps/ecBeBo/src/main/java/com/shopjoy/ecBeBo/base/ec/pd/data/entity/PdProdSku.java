package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pd_prod_sku", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 SKU 엔티티
@Comment("상품 옵션 SKU (조합별 재고/가격)")
public class PdProdSku extends BaseEntity {

    @Id
    @Comment("SKU ID")
    @Column(name = "prod_sku_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodSkuId 는 21자 이내여야 합니다.")
    private String prodSkuId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("옵션1 값ID (pd_prod_opt.prod_opt_id)")
    @Column(name = "prod_opt1_id", length = 21)
    @Size(max = 21, message = "prodOpt1Id 는 21자 이내여야 합니다.")
    private String prodOpt1Id;

    @Comment("옵션2 값ID (pd_prod_opt.prod_opt_id)")
    @Column(name = "prod_opt2_id", length = 21)
    @Size(max = 21, message = "prodOpt2Id 는 21자 이내여야 합니다.")
    private String prodOpt2Id;

    @Comment("자체 SKU 코드")
    @Column(name = "prod_sku_code", length = 50)
    @Size(max = 50, message = "prodSkuCode 는 50자 이내여야 합니다.")
    private String prodSkuCode;

    @Comment("옵션 추가금액 (기본가 대비)")
    @Column(name = "add_price")
    private Long addPrice;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
