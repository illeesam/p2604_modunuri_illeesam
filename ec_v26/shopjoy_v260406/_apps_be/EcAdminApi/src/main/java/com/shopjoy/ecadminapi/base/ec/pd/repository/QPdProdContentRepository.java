package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;

import java.util.List;
import java.util.Optional;

/** PdProdContent QueryDSL Custom Repository */
public interface QPdProdContentRepository {

    Optional<PdProdContentDto.Item> selectById(String prodContentId);

    List<PdProdContentDto.Item> selectList(PdProdContentDto.Request search);

    PdProdContentDto.PageResponse selectPageList(PdProdContentDto.Request search);

    int updateSelective(PdProdContent entity);
}
