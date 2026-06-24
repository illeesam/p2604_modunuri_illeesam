package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmDashboardItemRepository extends JpaRepository<CmDashboardItem, String> {

    List<CmDashboardItem> findBySiteIdAndUiNmOrderBySortOrdAsc(String siteId, String uiNm);

    List<CmDashboardItem> findBySiteIdAndUiNmAndUseYnOrderBySortOrdAsc(
            String siteId, String uiNm, String useYn);
}
