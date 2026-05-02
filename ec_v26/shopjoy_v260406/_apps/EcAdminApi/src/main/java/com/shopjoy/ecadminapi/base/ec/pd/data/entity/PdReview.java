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

@Entity
@Table(name = "pd_review", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 리뷰 엔티티
public class PdReview extends BaseEntity {

    @Id
    @Column(name = "review_id", length = 21, nullable = false)
    private String reviewId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "review_title", length = 200, nullable = false)
    private String reviewTitle;

    @Column(name = "review_content", columnDefinition = "TEXT")
    private String reviewContent;

    @Column(name = "rating", nullable = false)
    private BigDecimal rating;

    @Column(name = "helpful_cnt")
    private Integer helpfulCnt;

    @Column(name = "unhelpful_cnt")
    private Integer unhelpfulCnt;

    @Column(name = "review_status_cd", length = 20)
    private String reviewStatusCd;

    @Column(name = "review_status_cd_before", length = 20)
    private String reviewStatusCdBefore;

    @Column(name = "review_date")
    private LocalDateTime reviewDate;

}
