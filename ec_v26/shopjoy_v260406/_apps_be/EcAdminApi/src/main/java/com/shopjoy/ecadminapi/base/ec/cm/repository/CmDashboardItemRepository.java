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
}
