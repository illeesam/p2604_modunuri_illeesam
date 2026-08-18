package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pdh_prod_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 변경 이력 엔티티
@Comment("상품 변경 이력")
public class PdhProdChgHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "prod_chg_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodChgHistId 는 21자 이내여야 합니다.")
    private String prodChgHistId;


    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("변경유형코드 (PRICE/STOCK/STATUS)")
    @Column(name = "chg_type_cd", length = 30)
    @Size(max = 30, message = "chgTypeCd 는 30자 이내여야 합니다.")
    private String chgTypeCd;

    @Comment("변경전값")
    @Column(name = "before_val", columnDefinition = "TEXT")
    @Size(max = 50000, message = "beforeVal 는 50000자 이내여야 합니다.")
    private String beforeVal;

    @Comment("변경후값")
    @Column(name = "after_val", columnDefinition = "TEXT")
    @Size(max = 50000, message = "afterVal 는 50000자 이내여야 합니다.")
    private String afterVal;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 200)
    @Size(max = 100, message = "chgReason 는 100자 이내여야 합니다.")
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    @Size(max = 21, message = "chgUserId 는 21자 이내여야 합니다.")
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
