package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "histId 는 21자 이내여야 합니다.")
    private String histId;


    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("상품컨텐츠ID (pd_prod_content.)")
    @Column(name = "prod_content_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodContentId 는 21자 이내여야 합니다.")
    private String prodContentId;

    @Comment("컨텐츠유형코드 (상세설명, 사용설명, 배송정보 등)")
    @Column(name = "content_type_cd", length = 50)
    @Size(max = 50, message = "contentTypeCd 는 50자 이내여야 합니다.")
    private String contentTypeCd;

    /* pd_prod_content.content_html / pd_prod.content_html 값을 그대로 스냅샷 저장하는 이력 컬럼이므로
       원본 필드와 동일한 상한을 둔다 — 원본이 허용하는 크기의 콘텐츠를 저장할 때 이력 기록이 먼저 막히면 안 된다. */
    @Comment("변경전 HTML 컨텐츠")
    @Column(name = "content_before", columnDefinition = "TEXT")
    @Size(max = 10000000, message = "contentBefore 는 10,000,000자 이내여야 합니다.")
    private String contentBefore;

    @Comment("변경후 HTML 컨텐츠")
    @Column(name = "content_after", columnDefinition = "TEXT")
    @Size(max = 10000000, message = "contentAfter 는 10,000,000자 이내여야 합니다.")
    private String contentAfter;

    @Comment("변경사유 (예: 내용 오류 수정, 계절 업데이트)")
    @Column(name = "chg_reason", length = 200)
    @Size(max = 200, message = "chgReason 는 200자 이내여야 합니다.")
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    @Size(max = 21, message = "chgUserId 는 21자 이내여야 합니다.")
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
