package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;

import java.util.List;

/**
 * PdProdPlan QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 자식 컬렉션이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴). deleteByProdId /
 * findActivePlans / findEndedActivePlans 는 계산식·조건이 얽힌 JPQL {@code @Query} 라 그대로 둔다.</p>
 */
public interface QPdProdPlanRepository {

    /** 상품별 판매계획 목록 — sortOrd 오름차순 고정. base 의 findByProdIdOrderBySortOrdAsc 대체 (2026-08-27) */
    List<PdProdPlan> selectListByProdId(String prodId);

    /** 현재 시각 기준 ACTIVE/SCHEDULED 상태인 계획 중 지금 적용되어야 하는 것 (mutate+save 필요).
     *  base 의 findActivePlans 대체 (2026-08-27) */
    List<PdProdPlan> selectActivePlans(java.time.LocalDateTime now);

    /** 종료된 ACTIVE 계획 (endDatetime <= now, mutate+save 필요). base 의 findEndedActivePlans 대체 (2026-08-27) */
    List<PdProdPlan> selectEndedActivePlans(java.time.LocalDateTime now);
}
