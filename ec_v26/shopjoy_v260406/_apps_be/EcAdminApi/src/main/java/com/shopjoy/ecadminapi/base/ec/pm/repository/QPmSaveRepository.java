package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;

import java.util.List;
import java.util.Optional;

/** PmSave QueryDSL Custom Repository */
public interface QPmSaveRepository {

    Optional<PmSaveDto.Item> selectById(String saveId);

    List<PmSaveDto.Item> selectList(PmSaveDto.Request search);

    PmSaveDto.PageResponse selectPageList(PmSaveDto.Request search);

    int updateSelective(PmSave entity);
}
