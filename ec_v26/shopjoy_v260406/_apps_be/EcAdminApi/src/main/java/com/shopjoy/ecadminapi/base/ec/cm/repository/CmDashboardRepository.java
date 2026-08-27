package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/* findAllByOrderBySortOrdAsc / findByUseYnOrderBySortOrdAsc → QCmDashboardRepository.selectList(useYn) 로 통합
   findByUiCompNm → QCmDashboardRepository.selectByUiCompNm 로 전환 (2026-08-27) */
@Repository
public interface CmDashboardRepository extends JpaRepository<CmDashboard, String>, QCmDashboardRepository {
}
