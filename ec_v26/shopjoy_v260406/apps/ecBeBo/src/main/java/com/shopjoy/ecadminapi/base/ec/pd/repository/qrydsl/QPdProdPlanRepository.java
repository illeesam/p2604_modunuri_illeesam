package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PdProdPlan QueryDSL Custom Repository.
 *
 * <p>파라미터 3개 이상인 조회만 QueryDSL 사용 — 그 외 단순 조회는 base 의 파생 쿼리.</p>
 */
public interface QPdProdPlanRepository {

    /** 현재 시각 기준 ACTIVE/SCHEDULED 상태인 계획 중 지금 적용되어야 하는 것 */
    List<PdProdPlan> selectActivePlans(LocalDateTime now, String excludeStatusCd);
}
