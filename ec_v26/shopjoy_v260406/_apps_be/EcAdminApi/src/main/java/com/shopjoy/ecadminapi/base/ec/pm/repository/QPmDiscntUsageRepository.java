package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;

import java.util.List;
import java.util.Optional;

/** PmDiscntUsage QueryDSL Custom Repository */
public interface QPmDiscntUsageRepository {

    Optional<PmDiscntUsageDto.Item> selectById(String discntUsageId);

    List<PmDiscntUsageDto.Item> selectList(PmDiscntUsageDto.Request search);

    PmDiscntUsageDto.PageResponse selectPageList(PmDiscntUsageDto.Request search);

    int updateSelective(PmDiscntUsage entity);
}
