package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardRepository extends JpaRepository<CmDashboard, String> {
    List<CmDashboard> findBySiteIdOrderBySortOrdAsc(String siteId);
    List<CmDashboard> findBySiteIdAndUseYnOrderBySortOrdAsc(String siteId, String useYn);
    Optional<CmDashboard> findBySiteIdAndUiCompNm(String siteId, String uiCompNm);
}
