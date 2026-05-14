package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;

import java.util.List;
import java.util.Optional;

/** PdProdBundleItem QueryDSL Custom Repository */
public interface QPdProdBundleItemRepository {

    Optional<PdProdBundleItemDto.Item> selectById(String bundleItemId);

    List<PdProdBundleItemDto.Item> selectList(PdProdBundleItemDto.Request search);

    PdProdBundleItemDto.PageResponse selectPageList(PdProdBundleItemDto.Request search);

    int updateSelective(PdProdBundleItem entity);
}
