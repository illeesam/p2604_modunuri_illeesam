package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_plan", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 프로모션 플랜 엔티티
public class PmPlan {

    @Id
    @Column(name = "plan_id", length = 21, nullable = false)
    private String planId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "plan_nm", length = 100, nullable = false)
    private String planNm;

    @Column(name = "plan_title", length = 200, nullable = false)
    private String planTitle;

    @Column(name = "plan_type_cd", length = 20)
    private String planTypeCd;

    @Lob
    @Column(name = "plan_desc", columnDefinition = "TEXT")
    private String planDesc;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "plan_status_cd", length = 20)
    private String planStatusCd;

    @Column(name = "plan_status_cd_before", length = 20)
    private String planStatusCdBefore;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}