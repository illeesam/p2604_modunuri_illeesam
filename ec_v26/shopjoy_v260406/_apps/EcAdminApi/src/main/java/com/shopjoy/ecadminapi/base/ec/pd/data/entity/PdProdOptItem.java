package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_opt_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 옵션 아이템 엔티티
public class PdProdOptItem {

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

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}