package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;

/**
 * 대시보드 실 데이터 값 — 항상 <b>3레벨(항목)</b> 정의행 하나에만 값이 붙는다.
 *
 * <p>한 행 = "어느 3레벨 정의행({@code item_key}) 의, 어떤 차원조합({@code data_opts}) 값" 하나.
 * {@code data_opts} 는 값이 있는 차원만 {@code key:value} 로 만들어 key 오름차순 정렬 후 콤마로 이은
 * 문자열이라 차원이 늘어도 컬럼을 더 만들 필요가 없다. {@code (item_key, data_opts)} 가 UNIQUE 이고,
 * 같은 좌표가 다시 들어오면 새 행을 만들지 않고 그 행을 갱신한다(upsert).</p>
 *
 * <p>값은 숫자 하나({@code data_val})만 둔다 — 예전 col1~9 반복 컬럼은 3레벨(시리즈×항목)
 * 구조 도입으로 "행 하나 = 좌표 하나 = 값 하나" 가 되어 필요 없어졌다.</p>
 */
@Entity
@Table(name = "cm_dashboard_data", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("대시보드 3레벨 항목 실데이터")
public class CmDashboardData extends BaseEntity {

    @Id
    @Comment("데이터ID")
    @Column(name = "dashboard_data_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardDataId 는 21자 이내여야 합니다.")
    private String dashboardDataId;

    @Comment("대시보드ID (필수). dashboard_item_id 로 유도 가능하나 조회·필터용 반정규화")
    @Column(name = "dashboard_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardId 는 21자 이내여야 합니다.")
    private String dashboardId;

    @Comment("값이 붙은 3레벨(항목) 정의행 FK (항상 key_level=3)")
    @Column(name = "dashboard_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardItemId 는 21자 이내여야 합니다.")
    private String dashboardItemId;

    @Comment("값이 붙은 3레벨 정의행의 조립코드 (cm_dashboard_item.item_key). 조인 없이 위치를 읽기 위한 반정규화")
    @Column(name = "item_key", length = 150, nullable = false)
    @Size(max = 150, message = "itemKey 는 150자 이내여야 합니다.")
    private String itemKey;

    @Comment("차원 정규화 키 (예: period_type_cd:M,site_id:2604...,yyyymmdd:20260101). item_key 와 함께 UNIQUE")
    @Column(name = "data_opts", length = 500)
    @Size(max = 500, message = "dataOpts 는 500자 이내여야 합니다.")
    private String dataOpts;

    @Comment("값(숫자)")
    @Column(name = "data_val")
    private Double dataVal;

    @Comment("집계일자 (D=YYYYMMDD / M=YYYYMM00)")
    @Column(name = "yyyymmdd", length = 8, nullable = false)
    @Size(max = 8, message = "yyyymmdd 는 8자 이내여야 합니다.")
    private String yyyymmdd;

    /* 기간구분 — 월 데이터도 yyyymmdd 한 컬럼에 담는다(NOT NULL 유지 + BETWEEN 정렬 그대로 동작).
       D: yyyymmdd = YYYYMMDD (예 20260821) / M: yyyymmdd = YYYYMM + "00" (예 20260800) */
    @Comment("기간구분 D:일자(yyyymmdd=YYYYMMDD) / M:월(yyyymmdd=YYYYMM00)")
    @Column(name = "period_type_cd", length = 1)
    @Size(max = 1, message = "periodTypeCd 는 1자 이내여야 합니다.")
    private String periodTypeCd;

    @Comment("사이트ID (sy_site.site_id) — 업무 소속 사이트(필수 기준조건)")
    @Column(name = "site_id", length = 21)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id) — 선택 기준조건")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("판매업체ID (sy_vendor.vendor_id) — 선택 기준조건")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("부서ID (부서별 집계 시 사용)")
    @Column(name = "dept_id", length = 21)
    @Size(max = 21, message = "deptId 는 21자 이내여야 합니다.")
    private String deptId;

    @Comment("사용자ID (개인별 집계 시 사용)")
    @Column(name = "user_id", length = 21)
    @Size(max = 21, message = "userId 는 21자 이내여야 합니다.")
    private String userId;
}
