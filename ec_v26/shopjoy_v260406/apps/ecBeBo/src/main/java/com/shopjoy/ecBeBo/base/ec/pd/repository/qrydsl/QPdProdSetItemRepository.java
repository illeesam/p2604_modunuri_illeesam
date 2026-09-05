package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdSetItem;

import java.util.List;
import java.util.Optional;

/** PdProdSetItem QueryDSL Custom Repository */
public interface QPdProdSetItemRepository {

    Optional<PdProdSetItemDto.Item> selectById(String prodSetItemId);

    List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request search);

    BasePage<PdProdSetItemDto.Item> selectPageData(PdProdSetItemDto.Request search);

    int updateSelective(PdProdSetItem entity);
}
