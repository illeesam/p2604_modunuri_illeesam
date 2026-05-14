package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;

import java.util.List;
import java.util.Optional;

/** PmPlan QueryDSL Custom Repository */
public interface QPmPlanRepository {

    Optional<PmPlanDto.Item> selectById(String planId);

    List<PmPlanDto.Item> selectList(PmPlanDto.Request search);

    PmPlanDto.PageResponse selectPageList(PmPlanDto.Request search);

    int updateSelective(PmPlan entity);
}
