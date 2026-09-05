package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdTag;

import java.util.List;
import java.util.Optional;

/** PdProdTag QueryDSL Custom Repository */
public interface QPdProdTagRepository {

    Optional<PdProdTagDto.Item> selectById(String prodTagId);

    List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search);

    BasePage<PdProdTagDto.Item> selectPageData(PdProdTagDto.Request search);

    int updateSelective(PdProdTag entity);
}
