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
    private String prodChgHistId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("변경유형코드 (PRICE/STOCK/STATUS)")
    @Column(name = "chg_type_cd", length = 30)
    private String chgTypeCd;

    @Comment("변경전값")
    @Column(name = "before_val", columnDefinition = "TEXT")
    private String beforeVal;

    @Comment("변경후값")
    @Column(name = "after_val", columnDefinition = "TEXT")
    private String afterVal;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 200)
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
