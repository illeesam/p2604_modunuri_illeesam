package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmDashboardMenuRepository extends JpaRepository<CmDashboardMenu, String> {

    /** 내 메뉴 트리 (같은 부모 안에서는 sort_ord 순) */
    List<CmDashboardMenu> findBySiteIdAndOwnerUserIdOrderBySortOrdAsc(String siteId, String ownerUserId);

    /** 저장 시 내 노드만 전부 지운다 — 다른 사용자 트리는 건드리지 않는다 */
    void deleteBySiteIdAndOwnerUserId(String siteId, String ownerUserId);
}
