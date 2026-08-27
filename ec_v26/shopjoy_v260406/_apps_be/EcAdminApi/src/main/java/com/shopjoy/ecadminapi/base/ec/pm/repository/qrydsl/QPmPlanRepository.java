package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;

import java.util.List;
import java.util.Optional;

/** PmPlan QueryDSL Custom Repository */
public interface QPmPlanRepository {

    Optional<PmPlanDto.Item> selectById(String planId);

    List<PmPlanDto.Item> selectList(PmPlanDto.Request search);

    BasePage<PmPlanDto.Item> selectPageData(PmPlanDto.Request search);

    int updateSelective(PmPlan entity);

    /** 상태 배치 동기화 대상 — useYn=Y AND (DRAFT/ACTIVE) (mutate+save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findSyncTargets 대체 (2026-08-27) */
    List<PmPlan> selectSyncTargets();
}
