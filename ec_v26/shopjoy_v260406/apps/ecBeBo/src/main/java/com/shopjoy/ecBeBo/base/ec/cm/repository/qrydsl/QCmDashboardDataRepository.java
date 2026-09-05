package com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmDashboardData;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CmDashboardData QueryDSL Custom Repository.
 *
 * <p>기본 3종 {@code selectList}/{@code selectPageData}(이 엔티티는 페이징 소비처가 없어 미정의) /
 * {@code updateSelective} 위주로 구성한다(base.backend-EcAdminApi.md §14.6.8). 그 외
 * {@code selectByCoordinate}(UNIQUE 좌표조회)/{@code updateItemKey}(계산식 UPDATE) 는 위 3종으로
 * 표현이 안 되는 진짜 필요한 경우라 별도로 둔다.</p>
 */
public interface QCmDashboardDataRepository {

    /** 단건 조회 (dashboardDataId) */
    Optional<CmDashboardData> selectById(String dashboardDataId);

    /**
     * 조건 목록 조회 — siteId / yyyymmdd / dashboardItemIds(목록, 필수) 조합.
     * '데이터관리' 화면 조회(findRows)가 쓰는 (사이트 × 기간 × 차트들) 패턴.
     */
    List<CmDashboardData> selectList(Map<String, Object> p);

    /** 좌표 조회 — (item_key, data_opts, data_opt2s) 가 UNIQUE 라 최대 1건. 저장 시 upsert 판정에 쓴다 */
    Optional<CmDashboardData> selectByCoordinate(String itemKey, String dataOpts, String dataOpt2s);

    /** null 아닌 필드만 SET 하는 부분수정 */
    int updateSelective(CmDashboardData entity);

    /**
     * 키명 변경 시 데이터의 조립코드(item_key)와 그 레벨별 조각(item1/2/3_key)을 함께 갱신한다
     * (값은 그대로 유지). split_part 는 CmDashboardItem.deriveItemLevelKeys() 와 같은 규칙
     * ("-" 로 나눈 1/2/3번째 조각 그대로, 누적 아님)을 SQL 로 옮긴 것 — 없는 조각은 빈 문자열이라
     * NULLIF 로 NULL 처리한다.
     */
    int updateItemKey(String oldKey, String newKey);
}
