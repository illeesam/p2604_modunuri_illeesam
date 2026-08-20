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
@Entity
@Table(name = "cm_dashboard_item_data", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("대시보드 차트 패널 집계 데이터")
public class CmDashboardItemData extends BaseEntity {

    @Id
    @Comment("데이터ID")
    @Column(name = "dashboard_item_data_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardItemDataId 는 21자 이내여야 합니다.")
    private String dashboardItemDataId;


    @Comment("패널ID FK")
    @Column(name = "dashboard_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardItemId 는 21자 이내여야 합니다.")
    private String dashboardItemId;

    @Comment("화면명 역정규화")
    @Column(name = "ui_nm", length = 100, nullable = false)
    @Size(max = 100, message = "uiNm 는 100자 이내여야 합니다.")
    private String uiNm;

    @Comment("패널키 역정규화")
    @Column(name = "item_key", length = 50, nullable = false)
    @Size(max = 50, message = "itemKey 는 50자 이내여야 합니다.")
    private String itemKey;

    /* ── 3레벨 구조 (2026-08-21) ───────────────────────────────────────────────
       1레벨 차트명   = cm_dashboard_item.item_nm  (이 행의 dashboard_item_id 가 가리킴)
       2레벨 시리즈명 = series_nm                   (아래) — 데이터관리 그리드의 "행 제목"
       3레벨 항목명   = col1_nm ~ col9_nm           (아래) — 데이터관리 그리드의 "열 제목"
       즉 (차트 × 시리즈 × 기간 × 상품 × 업체) 한 조합이 이 테이블의 한 행이고,
       그 행 안에서 col1~col9 가 가로로 펼쳐진다. */
    @Comment("시리즈명 (2레벨 — 데이터관리 그리드의 행 제목). NULL=단일 시리즈")
    @Column(name = "series_nm", length = 100)
    @Size(max = 100, message = "seriesNm 는 100자 이내여야 합니다.")
    private String seriesNm;

    @Comment("시리즈 코드 (2레벨) — 고유 item_code 조립용. 공통코드 value 또는 직접입력값")
    @Column(name = "series_cd", length = 50)
    @Size(max = 50, message = "seriesCd 는 50자 이내여야 합니다.")
    private String seriesCd;

    @Comment("사이트ID (sy_site.site_id) — 업무 소속 사이트(필수 기준조건)")
    @Column(name = "site_id", length = 21)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    /* 기간구분 — 월 데이터도 yyyymmdd 한 컬럼에 담는다(NOT NULL 유지 + BETWEEN 정렬 그대로 동작).
       D: yyyymmdd = YYYYMMDD (예 20260821) / M: yyyymmdd = YYYYMM + "00" (예 20260800) */
    @Comment("기간구분 D:일자(yyyymmdd=YYYYMMDD) / M:월(yyyymmdd=YYYYMM00)")
    @Column(name = "period_type_cd", length = 1)
    @Size(max = 1, message = "periodTypeCd 는 1자 이내여야 합니다.")
    private String periodTypeCd;

    @Comment("상품ID (pd_prod.prod_id) — 선택 기준조건")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("판매업체ID (sy_vendor.vendor_id) — 선택 기준조건")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("집계일자 (D=YYYYMMDD / M=YYYYMM00)")
    @Column(name = "yyyymmdd", length = 8, nullable = false)
    @Size(max = 8, message = "yyyymmdd 는 8자 이내여야 합니다.")
    private String yyyymmdd;

    @Comment("부서ID")
    @Column(name = "dept_id", length = 21)
    @Size(max = 21, message = "deptId 는 21자 이내여야 합니다.")
    private String deptId;

    @Comment("사용자ID")
    @Column(name = "user_id", length = 21)
    @Size(max = 21, message = "userId 는 21자 이내여야 합니다.")
    private String userId;

    @Comment("데이터 JSON")
    @Column(name = "data_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "dataJson 는 500,000자 이내여야 합니다.")
    private String dataJson;

    @Comment("지표1명")
    @Column(name = "col1_nm", length = 100)
    @Size(max = 100, message = "col1Nm 는 100자 이내여야 합니다.")
    private String col1Nm;

    @Comment("지표2명")
    @Column(name = "col2_nm", length = 100)
    @Size(max = 100, message = "col2Nm 는 100자 이내여야 합니다.")
    private String col2Nm;

    @Comment("지표3명")
    @Column(name = "col3_nm", length = 100)
    @Size(max = 100, message = "col3Nm 는 100자 이내여야 합니다.")
    private String col3Nm;

    @Comment("지표4명")
    @Column(name = "col4_nm", length = 100)
    @Size(max = 100, message = "col4Nm 는 100자 이내여야 합니다.")
    private String col4Nm;

    @Comment("지표5명")
    @Column(name = "col5_nm", length = 100)
    @Size(max = 100, message = "col5Nm 는 100자 이내여야 합니다.")
    private String col5Nm;

    @Comment("지표6명")
    @Column(name = "col6_nm", length = 100)
    @Size(max = 100, message = "col6Nm 는 100자 이내여야 합니다.")
    private String col6Nm;

    @Comment("지표7명")
    @Column(name = "col7_nm", length = 100)
    @Size(max = 100, message = "col7Nm 는 100자 이내여야 합니다.")
    private String col7Nm;

    @Comment("지표8명")
    @Column(name = "col8_nm", length = 100)
    @Size(max = 100, message = "col8Nm 는 100자 이내여야 합니다.")
    private String col8Nm;

    @Comment("지표9명")
    @Column(name = "col9_nm", length = 100)
    @Size(max = 100, message = "col9Nm 는 100자 이내여야 합니다.")
    private String col9Nm;

    @Comment("지표1값")
    @Column(name = "col1_num")
    private Double col1Num;

    @Comment("지표2값")
    @Column(name = "col2_num")
    private Double col2Num;

    @Comment("지표3값")
    @Column(name = "col3_num")
    private Double col3Num;

    @Comment("지표4값")
    @Column(name = "col4_num")
    private Double col4Num;

    @Comment("지표5값")
    @Column(name = "col5_num")
    private Double col5Num;

    @Comment("지표6값")
    @Column(name = "col6_num")
    private Double col6Num;

    @Comment("지표7값")
    @Column(name = "col7_num")
    private Double col7Num;

    @Comment("지표8값")
    @Column(name = "col8_num")
    private Double col8Num;

    @Comment("지표9값")
    @Column(name = "col9_num")
    private Double col9Num;
}
