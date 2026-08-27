package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.common.data.BasePage;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CmDashboardItem QueryDSL Custom Repository.
 *
 * <p>기본 3종 {@code selectList}/{@code selectPageData}/{@code updateSelective} 위주로 구성한다
 * (base.backend-EcAdminApi.md §14.6.8). {@code selectById} 는 다른 조회들과 마찬가지로
 * hibernate.comment 힌트가 붙어 쿼리 로그 추적이 되는 QueryDSL 진입점으로 추가했다 — 내부에서
 * 같은 트랜잭션 안 엔티티를 그대로 수정·저장해야 하는 곳(putRow/renameByCode 등)은 여전히
 * {@code JpaRepository.findById}를 직접 쓴다(그쪽은 굳이 바꿀 이유가 없는 단순 1조건 조회).</p>
 */
public interface QCmDashboardItemRepository {

    /** 단건 조회 (dashboardItemId) */
    Optional<CmDashboardItem> selectById(String dashboardItemId);

    /** UNIQUE(item_key) 단건 조회 — base 의 findByItemKey 대체 (2026-08-27) */
    Optional<CmDashboardItem> selectByItemKey(String itemKey);

    /**
     * 조건 목록 조회 — dashboardId(단일) / useYn / parentDashboardItemId(단일) /
     * parentDashboardItemIds(목록, 콤마 아니라 진짜 List) 를 옵션으로 받는다. 아무 것도 안 주면
     * 전체. sortOrd 오름차순 고정.
     *
     * <p>예전에 있던 findByDashboardIdOrderBySortOrdAsc / findByDashboardIdAndUseYnOrderBySortOrdAsc /
     * findAllByOrderBySortOrdAsc / findByParentDashboardItemId / findByParentDashboardItemIdIn
     * 다섯 개를 이 하나로 합쳤다(2026-08-27) — 전부 "필터 조합만 다른 같은 조회"였다.</p>
     */
    List<CmDashboardItem> selectList(Map<String, Object> p);

    /**
     * 차트(keyLevel=1) 서버사이드 페이징 조회 — 항목관리 화면의 "대시보드 위젯항목 목록".
     * 파라미터: dashboardId(단일) 또는 dashboardIds(콤마구분, 우선순위는 dashboardId 먼저) / useYn / itemNm / pageNo / pageSize.
     * itemNm 은 차트 자신의 이름뿐 아니라 그 아래 시리즈·항목(item1_key 가 자기 itemKey 와 같은
     * 행)의 이름까지 검색한다.
     */
    BasePage<CmDashboardItem> selectPageData(Map<String, Object> p);

    int updateSelective(CmDashboardItem entity);
}
