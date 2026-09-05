package com.shopjoy.ecBeBo.base.ec.cm.data.entity;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
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

    /* item1_key/item2_key/item3_key — 2026-08-26 신설: item_key("chart091-series01-item02")를
       "-" 로 나눈 각 조각을 그대로 담는다(누적 경로 아님) — item_key="chart091-series01-item02"
       라면 item1_key="chart091" / item2_key="series01" / item3_key="item02". cm_dashboard_data
       는 값이 항상 3레벨(leaf) 행에만 붙으므로 세 컬럼 모두 채워진다. 목적은 "이 차트 전체"나
       "이 시리즈 전체" 값을 item_key 문자열을 파싱하지 않고 item1_key/item2_key 로 바로
       조회할 수 있게 하는 것. cm_dashboard_item 의 같은 이름 컬럼과 값 규칙이 동일하다. */
    @Comment("1레벨(차트) 조각 — item_key 의 1번째 '-' 구분 조각 (예: chart091)")
    @Column(name = "item1_key", length = 150)
    @Size(max = 150, message = "item1Key 는 150자 이내여야 합니다.")
    private String item1Key;

    @Comment("2레벨(시리즈) 조각 — item_key 의 2번째 '-' 구분 조각 (예: series01)")
    @Column(name = "item2_key", length = 150)
    @Size(max = 150, message = "item2Key 는 150자 이내여야 합니다.")
    private String item2Key;

    @Comment("3레벨(항목) 조각 — item_key 의 3번째 '-' 구분 조각 (예: item02)")
    @Column(name = "item3_key", length = 150)
    @Size(max = 150, message = "item3Key 는 150자 이내여야 합니다.")
    private String item3Key;

    @Comment("차원 정규화 키(핵심) — site_id,yyyymmdd 두 개만. (예: site_id:2604...,yyyymmdd:202608). item_key+data_opt2s 와 함께 UNIQUE")
    @Column(name = "data_opts", length = 500)
    @Size(max = 500, message = "dataOpts 는 500자 이내여야 합니다.")
    private String dataOpts;

    /* data_opt2s — 2026-08-26 신설: site_id,yyyymmdd 를 뺀 나머지 선택 차원(dept_id/prod_id/
       user_id/vendor_id)을 data_opts 와 같은 형식(key:value, key 오름차순)으로 여기에 담는다.
       site_id+yyyymmdd 는 화면·배치가 항상 다루는 "핵심 좌표"라 data_opts 에 그대로 두고, 그
       외 선택적 차원을 분리해 두 컬럼을 보면 "필수 조건 vs 부가 조건"이 한눈에 구분되게 했다.
       date_type_cd 는 여기 포함하지 않는다(2026-08-26 2차) — yyyymmdd 값의 자리수(y=4/m=6/d=8)
       자체가 이미 그 값을 구분해주므로 UNIQUE 키에 중복으로 넣을 필요가 없다.
       UNIQUE는 (item_key, data_opts, data_opt2s) 세 컬럼 조합. */
    @Comment("차원 정규화 키(부가) — data_opts 를 뺀 나머지 선택 차원(dept_id/prod_id/user_id/vendor_id, date_type_cd 는 제외). item_key+data_opts 와 함께 UNIQUE")
    @Column(name = "data_opt2s", length = 500)
    @Size(max = 500, message = "dataOpt2s 는 500자 이내여야 합니다.")
    private String dataOpt2s;

    @Comment("값(숫자)")
    @Column(name = "data_val")
    private Double dataVal;

    @Comment("집계일자 — date_type_cd 에 맞는 실제 자리수만 채운다(y=4자리 / m=6자리 / d=8자리, 0-패딩 없음)")
    @Column(name = "yyyymmdd", length = 8, nullable = false)
    @Size(max = 8, message = "yyyymmdd 는 8자 이내여야 합니다.")
    private String yyyymmdd;

    /* 날짜 값 형식 — 월/연 데이터도 yyyymmdd 한 컬럼에 담는다. y:연도(yyyymmdd 컬럼에 "2026" 4자리만) /
       m:년월(yyyymmdd 컬럼에 "202608" 6자리만) / d:년월일(yyyymmdd 컬럼에 "20260821" 8자리 그대로).
       2026-08-26 개편: 컬럼명 period_type_cd → date_type_cd(조회"기간" 아니라 "날짜 값의 형식"을
       나타내므로 더 정확), 값도 D/M/Y → y/m/d 로 통일. 예전엔 yyyymmdd 컬럼을 어떤 타입이든 항상
       8자리로 0-패딩(YYYY0000/YYYYMM00)했었는데, 값 자체가 실제 자리수를 그대로 드러내도록 바꿨다
       — 그 대가로 여러 타입에 걸친 날짜범위(BETWEEN) 비교가 필요한 곳(예: queryWidgetRows)은
       비교 시점에 RPAD(yyyymmdd,8,'0') 로 맞춰서 비교해야 한다(길이가 다르면 사전식 비교가 깨짐). */
    @Comment("날짜 값 형식 y:연도(yyyymmdd=4자리 YYYY) / m:년월(yyyymmdd=6자리 YYYYMM) / d:년월일(yyyymmdd=8자리 YYYYMMDD)")
    @Column(name = "date_type_cd", length = 1)
    @Size(max = 1, message = "dateTypeCd 는 1자 이내여야 합니다.")
    private String dateTypeCd;

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

    /**
     * item1_key/item2_key/item3_key 자동 재계산(2026-08-26) — INSERT/UPDATE 직전마다 itemKey
     * 기준으로 다시 채운다. cm_dashboard_data 는 값이 항상 3레벨(leaf) 행에만 붙으므로
     * {@link com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmDashboardItem}과 달리 keyLevel
     * 분기 없이 세 조각 다 채운다. 엔티티 자체에 두는 이유는 저장 경로가
     * {@code CmDashboardDataGridService.upsert()}, {@code SyStatsDashboardJob.upsertLeaf()},
     * {@code CmDashboardDataService.upsert()}(외부 단건 upsert) 등 여러 곳인데, 어느 경로로
     * 들어오든 저장 직전에 한 번만 통과하는 지점이 JPA 라이프사이클뿐이라 여기서 한 번만
     * 구현하면 전부 커버되기 때문이다(예전엔 각 호출부가 직접 계산해 넣었는데,
     * CmDashboardDataService.upsert() 는 그 계산이 빠져 있었다 — 라이프사이클로 옮기면서 해소).
     */
    @jakarta.persistence.PrePersist
    @jakarta.persistence.PreUpdate
    private void deriveItemLevelKeys() {
        if (itemKey == null || itemKey.isBlank()) return;
        String[] seg = itemKey.split("-");
        item1Key = seg.length > 0 ? seg[0] : null;
        item2Key = seg.length > 1 ? seg[1] : null;
        item3Key = seg.length > 2 ? seg[2] : null;
    }
}
