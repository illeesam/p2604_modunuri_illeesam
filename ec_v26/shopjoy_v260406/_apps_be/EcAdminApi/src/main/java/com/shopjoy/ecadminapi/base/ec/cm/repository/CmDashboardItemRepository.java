package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * dashboardId/useYn/parentDashboardItemId(In) 조합으로 목록을 찾던 파생 쿼리 5개는
 * {@link QCmDashboardItemRepository#selectList} 로 통합했다(2026-08-27) — 전부 "필터 조합만
 * 다른 같은 조회"였다. {@code findByItemKey} 도 {@link QCmDashboardItemRepository#selectByItemKey}
 * 로 전환했다(2026-08-27).
 */
@Repository
public interface CmDashboardItemRepository extends JpaRepository<CmDashboardItem, String>, QCmDashboardItemRepository {
}
