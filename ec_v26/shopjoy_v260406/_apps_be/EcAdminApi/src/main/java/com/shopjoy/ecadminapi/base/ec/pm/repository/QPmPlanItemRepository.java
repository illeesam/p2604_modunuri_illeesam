package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;

import java.util.List;
import java.util.Optional;

/** PmPlanItem QueryDSL Custom Repository */
public interface QPmPlanItemRepository {

    Optional<PmPlanItemDto.Item> selectById(String planItemId);

    List<PmPlanItemDto.Item> selectList(PmPlanItemDto.Request search);

    PmPlanItemDto.PageResponse selectPageList(PmPlanItemDto.Request search);

    int updateSelective(PmPlanItem entity);
}
