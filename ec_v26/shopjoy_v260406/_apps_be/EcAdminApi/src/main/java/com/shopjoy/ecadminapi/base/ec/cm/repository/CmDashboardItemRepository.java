package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmDashboardItemRepository extends JpaRepository<CmDashboardItem, String> {
    List<CmDashboardItem> findByDashboardIdOrderBySortOrdAsc(String dashboardId);
    List<CmDashboardItem> findByDashboardIdAndUseYnOrderBySortOrdAsc(String dashboardId, String useYn);
    List<CmDashboardItem> findBySiteIdOrderBySortOrdAsc(String siteId);
}
