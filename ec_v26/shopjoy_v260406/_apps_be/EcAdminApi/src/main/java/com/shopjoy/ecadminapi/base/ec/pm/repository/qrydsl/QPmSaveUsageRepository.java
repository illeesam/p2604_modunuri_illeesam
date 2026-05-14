package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;

import java.util.List;
import java.util.Optional;

/** PmSaveUsage QueryDSL Custom Repository */
public interface QPmSaveUsageRepository {

    Optional<PmSaveUsageDto.Item> selectById(String saveUsageId);

    List<PmSaveUsageDto.Item> selectList(PmSaveUsageDto.Request search);

    PmSaveUsageDto.PageResponse selectPageList(PmSaveUsageDto.Request search);

    int updateSelective(PmSaveUsage entity);
}
