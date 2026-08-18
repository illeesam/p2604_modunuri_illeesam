package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pdh_prod_sku_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 SKU 변경 이력 엔티티
@Comment("SKU 상태 변경 이력 (가격→price_hist, 재고→stock_hist)")
public class PdhProdSkuChgHist {

    @Id
    @Comment("이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "histId 는 21자 이내여야 합니다.")
    private String histId;


    @Comment("SKU ID (pd_prod_sku.prod_sku_id)")
    @Column(name = "prod_sku_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodSkuId 는 21자 이내여야 합니다.")
    private String prodSkuId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("변경유형 (코드: SKU_CHG_TYPE — STATUS 등)")
    @Column(name = "chg_type_cd", length = 30, nullable = false)
    @Size(max = 30, message = "chgTypeCd 는 30자 이내여야 합니다.")
    private String chgTypeCd;

    @Comment("변경 전 값")
    @Column(name = "before_val", length = 100)
    @Size(max = 100, message = "beforeVal 는 100자 이내여야 합니다.")
    private String beforeVal;

    @Comment("변경 후 값")
    @Column(name = "after_val", length = 100)
    @Size(max = 100, message = "afterVal 는 100자 이내여야 합니다.")
    private String afterVal;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 200)
    @Size(max = 100, message = "chgReason 는 100자 이내여야 합니다.")
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_by", length = 20)
    @Size(max = 20, message = "chgBy 는 20자 이내여야 합니다.")
    private String chgBy;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("등록자")
    @Column(name = "reg_by", length = 30)
    @Size(max = 30, message = "regBy 는 30자 이내여야 합니다.")
    private String regBy;

    @Comment("등록일")
    @Column(name = "reg_date")
    private LocalDateTime regDate;

}