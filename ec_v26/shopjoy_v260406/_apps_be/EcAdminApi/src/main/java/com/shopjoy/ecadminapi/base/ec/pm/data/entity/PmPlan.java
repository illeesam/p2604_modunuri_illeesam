package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
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
    @Size(max = 21, message = "planId 는 21자 이내여야 합니다.")
    private String planId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("기획전명 (내부용)")
    @Column(name = "plan_nm", length = 100, nullable = false)
    @Size(max = 100, message = "planNm 는 100자 이내여야 합니다.")
    private String planNm;

    @Comment("기획전 타이틀 (노출용)")
    @Column(name = "plan_title", length = 200, nullable = false)
    @NotBlank(message = "기획전 제목을 입력해주세요.")
    @Size(max = 100, message = "기획전 제목은 100자 이내로 입력해주세요.")
    private String planTitle;

    @Comment("유형 (코드: PLAN_TYPE_CD — SEASON/BRAND/THEME/COLLAB)")
    @Column(name = "plan_type_cd", length = 20)
    @Size(max = 20, message = "planTypeCd 는 20자 이내여야 합니다.")
    private String planTypeCd;

    @Comment("테마 (코드: PLAN_THEME_CD — SPRING_NEW/SUMMER_COOL/CHUSEOK/WINTER_WARM/BLACK_FRI/LUXURY_BRAND/OUTDOOR/HOME_DECOR/HEALTH_FOOD/DIGITAL/FASHION/BEAUTY/KIDS/TRAVEL/PET/CHILDREN_DAY/CHRISTMAS/NEW_YEAR/ZOMBIE_DAY/DISABILITY/HALLOWEEN)")
    @Column(name = "plan_theme_cd", length = 30)
    @Size(max = 30, message = "planThemeCd 는 30자 이내여야 합니다.")
    private String planThemeCd;

    @Comment("기획전 설명")
    @Column(name = "plan_desc", columnDefinition = "TEXT")
    @Size(max = 500000, message = "planDesc 는 500,000자 이내여야 합니다.")
    private String planDesc;

    @Comment("썸네일 이미지 URL")
    @Column(name = "thumbnail_url", length = 500)
    @Size(max = 100, message = "thumbnailUrl 는 100자 이내여야 합니다.")
    private String thumbnailUrl;

    @Comment("배너 이미지 URL")
    @Column(name = "banner_url", length = 500)
    @Size(max = 100, message = "bannerUrl 는 100자 이내여야 합니다.")
    private String bannerUrl;

    @Comment("시작일시")
    @Column(name = "start_date")
    private LocalDate startDate;

    @Comment("종료일시")
    @Column(name = "end_date")
    private LocalDate endDate;

    @Comment("상태 (코드: PLAN_STATUS_CD — DRAFT/ACTIVE/ENDED)")
    @Column(name = "plan_status_cd", length = 20)
    @Size(max = 20, message = "planStatusCd 는 20자 이내여야 합니다.")
    private String planStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "plan_status_cd_before", length = 20)
    @Size(max = 20, message = "planStatusCdBefore 는 20자 이내여야 합니다.")
    private String planStatusCdBefore;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

}
