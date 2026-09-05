package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmDashboardMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmDashboardMenuRepository extends JpaRepository<CmDashboardMenu, String> {

    /** 내 메뉴 트리 (같은 부모 안에서는 sort_ord 순) */
    List<CmDashboardMenu> findByMenuScopeCdAndOwnerUserIdOrderBySortOrdAsc(
            String menuScopeCd, String ownerUserId);

    /** 사이트 공통(SYS) 메뉴 트리 — 주인이 없으므로 소유자 조건이 없다 */
    List<CmDashboardMenu> findByMenuScopeCdOrderBySortOrdAsc(String menuScopeCd);

    /** 저장 시 내 노드만 전부 지운다 — 다른 사용자 트리는 건드리지 않는다 */
    void deleteByMenuScopeCdAndOwnerUserId(String menuScopeCd, String ownerUserId);

    /** 저장 시 사이트 공통 노드를 전부 지운다 */
    void deleteByMenuScopeCd(String menuScopeCd);
}
