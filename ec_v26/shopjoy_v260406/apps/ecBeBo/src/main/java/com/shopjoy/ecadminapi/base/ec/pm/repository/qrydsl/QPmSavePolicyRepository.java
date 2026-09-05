package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSavePolicyDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSavePolicy;

import java.util.List;
import java.util.Optional;

/** PmSavePolicy QueryDSL Custom Repository */
public interface QPmSavePolicyRepository {

    Optional<PmSavePolicyDto.Item> selectById(String saveId);

    List<PmSavePolicyDto.Item> selectList(PmSavePolicyDto.Request search);

    BasePage<PmSavePolicyDto.Item> selectPageData(PmSavePolicyDto.Request search);

    int updateSelective(PmSavePolicy entity);
}
