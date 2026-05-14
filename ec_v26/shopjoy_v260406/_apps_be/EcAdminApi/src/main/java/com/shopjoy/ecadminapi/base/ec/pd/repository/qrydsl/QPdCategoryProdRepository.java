package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;

import java.util.List;
import java.util.Optional;

/** PdCategoryProd QueryDSL Custom Repository */
public interface QPdCategoryProdRepository {

    Optional<PdCategoryProdDto.Item> selectById(String categoryProdId);

    List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request search);

    PdCategoryProdDto.PageResponse selectPageList(PdCategoryProdDto.Request search);

    int updateSelective(PdCategoryProd entity);
}
