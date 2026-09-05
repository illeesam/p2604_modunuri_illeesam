package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSaveUsage;

import java.util.List;
import java.util.Optional;

/** PmSaveUsage QueryDSL Custom Repository */
public interface QPmSaveUsageRepository {

    Optional<PmSaveUsageDto.Item> selectById(String saveUsageId);

    List<PmSaveUsageDto.Item> selectList(PmSaveUsageDto.Request search);

    BasePage<PmSaveUsageDto.Item> selectPageData(PmSaveUsageDto.Request search);

    int updateSelective(PmSaveUsage entity);
}
