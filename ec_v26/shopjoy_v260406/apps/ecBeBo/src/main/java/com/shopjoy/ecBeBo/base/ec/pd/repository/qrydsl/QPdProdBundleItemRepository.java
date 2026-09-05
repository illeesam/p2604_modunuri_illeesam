package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdBundleItem;

import java.util.List;
import java.util.Optional;

/** PdProdBundleItem QueryDSL Custom Repository */
public interface QPdProdBundleItemRepository {

    Optional<PdProdBundleItemDto.Item> selectById(String prodBundleItemId);

    List<PdProdBundleItemDto.Item> selectList(PdProdBundleItemDto.Request search);

    BasePage<PdProdBundleItemDto.Item> selectPageData(PdProdBundleItemDto.Request search);

    int updateSelective(PdProdBundleItem entity);
}
