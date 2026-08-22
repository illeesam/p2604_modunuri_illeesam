package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardItemRepository extends JpaRepository<CmDashboardItem, String>, QCmDashboardItemRepository {
    List<CmDashboardItem> findByDashboardIdOrderBySortOrdAsc(String dashboardId);
    List<CmDashboardItem> findByDashboardIdAndUseYnOrderBySortOrdAsc(String dashboardId, String useYn);
    List<CmDashboardItem> findAllByOrderBySortOrdAsc();

    /** item_key 는 전역 UNIQUE — 조립코드로 정의행 하나를 바로 찾을 때 사용 */
    Optional<CmDashboardItem> findByItemKey(String itemKey);

    /** 부모(정의행) 기준 자식 목록 — dashboardId 로 좁히지 않는다.
     *  차트를 다른 대시보드로 옮긴 직후에는 하위 시리즈·항목이 아직 옛 dashboardId 를 갖고 있어
     *  dashboardId 로 좁히면 못 찾는다(descendantsOf() 참고) */
    List<CmDashboardItem> findByParentDashboardItemId(String parentDashboardItemId);

    /** findByParentDashboardItemId 의 배치(IN) 버전 — 여러 부모의 자식을 한 번에 조회.
     *  차트별로 루프 돌며 findByParentDashboardItemId 를 N번 부르면(N+1) 차트 30개 페이지 기준
     *  차트조회+시리즈조회(30)+항목조회(시리즈수만큼, 수십~백여 회)까지 수백 개 쿼리가 나가
     *  체감상 느려진다 — getItemTreeByChartIds() 는 반드시 이걸로 한 번에 가져온다. */
    List<CmDashboardItem> findByParentDashboardItemIdIn(List<String> parentDashboardItemIds);
}
