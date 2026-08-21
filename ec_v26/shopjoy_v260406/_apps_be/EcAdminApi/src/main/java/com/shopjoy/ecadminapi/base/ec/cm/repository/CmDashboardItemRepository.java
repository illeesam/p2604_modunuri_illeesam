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
}
