package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardMenu;

import java.util.List;

/**
 * CmDashboardMenu QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 트리 테이블이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴).</p>
 */
public interface QCmDashboardMenuRepository {

    /** 조건 목록 조회 — menuScopeCd(필수) + ownerUserId(선택, SYS 스코프는 주인이 없어 생략).
     *  sortOrd 오름차순 고정. base 의 findByMenuScopeCdAndOwnerUserIdOrderBySortOrdAsc /
     *  findByMenuScopeCdOrderBySortOrdAsc 대체 (2026-08-27) */
    List<CmDashboardMenu> selectList(String menuScopeCd, String ownerUserId);
}
