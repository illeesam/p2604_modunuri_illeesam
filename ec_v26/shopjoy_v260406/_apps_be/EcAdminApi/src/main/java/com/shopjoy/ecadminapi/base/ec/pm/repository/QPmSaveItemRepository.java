package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;

import java.util.List;
import java.util.Optional;

/** PmSaveItem QueryDSL Custom Repository */
public interface QPmSaveItemRepository {

    Optional<PmSaveItemDto.Item> selectById(String saveItemId);

    List<PmSaveItemDto.Item> selectList(PmSaveItemDto.Request search);

    PmSaveItemDto.PageResponse selectPageList(PmSaveItemDto.Request search);

    int updateSelective(PmSaveItem entity);
}
