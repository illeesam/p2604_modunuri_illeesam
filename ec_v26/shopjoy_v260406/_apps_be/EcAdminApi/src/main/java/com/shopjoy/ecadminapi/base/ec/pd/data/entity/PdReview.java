package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_review", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 리뷰 엔티티
@Comment("상품 리뷰")
public class PdReview extends BaseEntity {

    @Id
    @Comment("리뷰ID (YYMMDDhhmmss+rand4)")
    @Column(name = "review_id", length = 21, nullable = false)
    private String reviewId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("리뷰 제목")
    @Column(name = "review_title", length = 200, nullable = false)
    private String reviewTitle;

    @Comment("리뷰 내용")
    @Column(name = "review_content", columnDefinition = "TEXT")
    private String reviewContent;

    @Comment("평점 (1.0~5.0)")
    @Column(name = "rating", nullable = false)
    private BigDecimal rating;

    @Comment("도움이 돼요 수")
    @Column(name = "helpful_cnt")
    private Integer helpfulCnt;

    @Comment("도움이 안 돼요 수")
    @Column(name = "unhelpful_cnt")
    private Integer unhelpfulCnt;

    @Comment("상태 (코드: REVIEW_STATUS)")
    @Column(name = "review_status_cd", length = 20)
    private String reviewStatusCd;

    @Comment("변경 전 리뷰상태 (코드: REVIEW_STATUS)")
    @Column(name = "review_status_cd_before", length = 20)
    private String reviewStatusCdBefore;

    @Comment("리뷰작성일")
    @Column(name = "review_date")
    private LocalDateTime reviewDate;

}
