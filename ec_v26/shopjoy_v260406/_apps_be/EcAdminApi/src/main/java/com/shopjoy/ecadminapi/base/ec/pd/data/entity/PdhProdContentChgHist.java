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
@Table(name = "pdh_prod_content_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 콘텐츠 변경 이력 엔티티
@Comment("상품 컨텐츠 변경 이력")
public class PdhProdContentChgHist extends BaseEntity {

    @Id
    @Comment("이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "hist_id", length = 21, nullable = false)
    private String histId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("상품컨텐츠ID (pd_prod_content.)")
    @Column(name = "prod_content_id", length = 21, nullable = false)
    private String prodContentId;

    @Comment("컨텐츠유형코드 (상세설명, 사용설명, 배송정보 등)")
    @Column(name = "content_type_cd", length = 50)
    private String contentTypeCd;

    @Comment("변경전 HTML 컨텐츠")
    @Column(name = "content_before", columnDefinition = "TEXT")
    private String contentBefore;

    @Comment("변경후 HTML 컨텐츠")
    @Column(name = "content_after", columnDefinition = "TEXT")
    private String contentAfter;

    @Comment("변경사유 (예: 내용 오류 수정, 계절 업데이트)")
    @Column(name = "chg_reason", length = 200)
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
