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
@Table(name = "pdh_prod_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 상태 이력 엔티티
@Comment("상품 상태 이력")
public class PdhProdStatusHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "prod_status_hist_id", length = 21, nullable = false)
    private String prodStatusHistId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("이전상태 (코드: PRODUCT_STATUS)")
    @Column(name = "before_status_cd", length = 20)
    private String beforeStatusCd;

    @Comment("변경상태 (코드: PRODUCT_STATUS)")
    @Column(name = "after_status_cd", length = 20, nullable = false)
    private String afterStatusCd;

    @Comment("처리메모")
    @Column(name = "memo", length = 300)
    private String memo;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "proc_user_id", length = 21)
    private String procUserId;

    @Comment("처리일시")
    @Column(name = "proc_date")
    private LocalDateTime procDate;

}
