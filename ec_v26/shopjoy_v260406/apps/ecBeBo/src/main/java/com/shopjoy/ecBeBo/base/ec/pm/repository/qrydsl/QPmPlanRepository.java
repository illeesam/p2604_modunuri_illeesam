package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmPlan;

import java.util.List;
import java.util.Optional;

/** PmPlan QueryDSL Custom Repository */
public interface QPmPlanRepository {

    Optional<PmPlanDto.Item> selectById(String planId);

    List<PmPlanDto.Item> selectList(PmPlanDto.Request search);

    BasePage<PmPlanDto.Item> selectPageData(PmPlanDto.Request search);

    int updateSelective(PmPlan entity);
}
