package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;

import java.util.List;
import java.util.Optional;

/** PdProdSetItem QueryDSL Custom Repository */
public interface QPdProdSetItemRepository {

    Optional<PdProdSetItemDto.Item> selectById(String setItemId);

    List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request search);

    PdProdSetItemDto.PageResponse selectPageList(PdProdSetItemDto.Request search);

    int updateSelective(PdProdSetItem entity);
}
