package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardMenu;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardMenuRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/* findByMenuScopeCdAndOwnerUserIdOrderBySortOrdAsc / findByMenuScopeCdOrderBySortOrdAsc
   → QCmDashboardMenuRepository.selectList(menuScopeCd, ownerUserId) 로 통합 (2026-08-27) */
@Repository
public interface CmDashboardMenuRepository extends JpaRepository<CmDashboardMenu, String>, QCmDashboardMenuRepository {

    /** 저장 시 내 노드만 전부 지운다 — 다른 사용자 트리는 건드리지 않는다 */
    void deleteByMenuScopeCdAndOwnerUserId(String menuScopeCd, String ownerUserId);

    /** 저장 시 사이트 공통 노드를 전부 지운다 */
    void deleteByMenuScopeCd(String menuScopeCd);
}
