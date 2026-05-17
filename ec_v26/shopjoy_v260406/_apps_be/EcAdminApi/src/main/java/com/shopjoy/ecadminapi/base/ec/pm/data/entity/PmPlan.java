package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

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
@Table(name = "pm_plan", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 프로모션 플랜 엔티티
@Comment("기획전")
public class PmPlan extends BaseEntity {

    @Id
    @Comment("기획전ID (YYMMDDhhmmss+rand4)")
    @Column(name = "plan_id", length = 21, nullable = false)
    private String planId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("기획전명 (내부용)")
    @Column(name = "plan_nm", length = 100, nullable = false)
    private String planNm;

    @Comment("기획전 타이틀 (노출용)")
    @Column(name = "plan_title", length = 200, nullable = false)
    private String planTitle;

    @Comment("유형 (코드: PLAN_TYPE — SEASON/BRAND/THEME/COLLAB)")
    @Column(name = "plan_type_cd", length = 20)
    private String planTypeCd;

    @Comment("기획전 설명")
    @Column(name = "plan_desc", columnDefinition = "TEXT")
    private String planDesc;

    @Comment("썸네일 이미지 URL")
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Comment("배너 이미지 URL")
    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Comment("시작일시")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Comment("종료일시")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Comment("상태 (코드: PLAN_STATUS — DRAFT/ACTIVE/ENDED)")
    @Column(name = "plan_status_cd", length = 20)
    private String planStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "plan_status_cd_before", length = 20)
    private String planStatusCdBefore;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
