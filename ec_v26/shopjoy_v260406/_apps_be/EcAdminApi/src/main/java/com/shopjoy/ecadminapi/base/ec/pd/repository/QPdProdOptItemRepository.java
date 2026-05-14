package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;

import java.util.List;
import java.util.Optional;

/** PdProdOptItem QueryDSL Custom Repository */
public interface QPdProdOptItemRepository {

    Optional<PdProdOptItemDto.Item> selectById(String optItemId);

    List<PdProdOptItemDto.Item> selectList(PdProdOptItemDto.Request search);

    PdProdOptItemDto.PageResponse selectPageList(PdProdOptItemDto.Request search);

    int updateSelective(PdProdOptItem entity);
}
