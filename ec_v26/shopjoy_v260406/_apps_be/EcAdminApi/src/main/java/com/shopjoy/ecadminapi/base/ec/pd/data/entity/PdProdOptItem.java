package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_opt_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 옵션 아이템 엔티티
public class PdProdOptItem extends BaseEntity {

    @Id
    @Column(name = "opt_item_id", length = 21, nullable = false)
    private String optItemId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "opt_id", length = 21, nullable = false)
    private String optId;

    @Column(name = "opt_type_cd", length = 20, nullable = false)
    private String optTypeCd;

    @Column(name = "opt_nm", length = 100, nullable = false)
    private String optNm;

    @Column(name = "opt_val", length = 50)
    private String optVal;

    @Column(name = "opt_val_code_id", length = 50)
    private String optValCodeId;

    @Column(name = "parent_opt_item_id", length = 21)
    private String parentOptItemId;

    @Column(name = "opt_style", length = 200)
    private String optStyle;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
