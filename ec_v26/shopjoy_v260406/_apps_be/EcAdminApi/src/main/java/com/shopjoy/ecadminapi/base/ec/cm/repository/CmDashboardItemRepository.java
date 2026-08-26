package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * dashboardId/useYn/parentDashboardItemId(In) 조합으로 목록을 찾던 파생 쿼리 5개는
 * {@link QCmDashboardItemRepository#selectList} 로 통합했다(2026-08-27) — 전부 "필터 조합만
 * 다른 같은 조회"였다. 여기 남은 {@code findByItemKey} 는 UNIQUE 컬럼 단건조회라 조건이 1개뿐
 * 이라 그대로 둔다(base.backend-EcAdminApi.md §14.6.8).
 */
@Repository
public interface CmDashboardItemRepository extends JpaRepository<CmDashboardItem, String>, QCmDashboardItemRepository {

    /** item_key 는 전역 UNIQUE — 조립코드로 정의행 하나를 바로 찾을 때 사용 */
    Optional<CmDashboardItem> findByItemKey(String itemKey);
}
