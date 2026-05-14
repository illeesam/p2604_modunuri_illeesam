package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;

import java.util.List;
import java.util.Optional;

/** PdProdTag QueryDSL Custom Repository */
public interface QPdProdTagRepository {

    Optional<PdProdTagDto.Item> selectById(String prodTagId);

    List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search);

    PdProdTagDto.PageResponse selectPageList(PdProdTagDto.Request search);

    int updateSelective(PdProdTag entity);
}
