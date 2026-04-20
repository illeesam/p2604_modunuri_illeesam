package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_review", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 리뷰 엔티티
public class PdReview {

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

    @Lob
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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}