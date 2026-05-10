package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pdh_prod_content_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 콘텐츠 변경 이력 엔티티
public class PdhProdContentChgHist extends BaseEntity {

    @Id
    @Column(name = "hist_id", length = 21, nullable = false)
    private String histId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "prod_content_id", length = 21, nullable = false)
    private String prodContentId;

    @Column(name = "content_type_cd", length = 50)
    private String contentTypeCd;

    @Column(name = "content_before", columnDefinition = "TEXT")
    private String contentBefore;

    @Column(name = "content_after", columnDefinition = "TEXT")
    private String contentAfter;

    @Column(name = "chg_reason", length = 200)
    private String chgReason;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
