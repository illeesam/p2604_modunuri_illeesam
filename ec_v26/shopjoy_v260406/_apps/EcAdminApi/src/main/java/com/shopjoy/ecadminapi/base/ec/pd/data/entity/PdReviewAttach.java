package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_review_attach", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 리뷰 첨부파일 엔티티
public class PdReviewAttach {

    @Id
    @Column(name = "review_attach_id", length = 21, nullable = false)
    private String reviewAttachId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "review_id", length = 21, nullable = false)
    private String reviewId;

    @Column(name = "attach_id", length = 21, nullable = false)
    private String attachId;

    @Column(name = "media_type_cd", length = 20)
    private String mediaTypeCd;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}