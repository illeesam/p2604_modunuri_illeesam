package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;

import java.util.List;
import java.util.Optional;

/** PdCategory QueryDSL Custom Repository */
public interface QPdCategoryRepository {

    Optional<PdCategoryDto.Item> selectById(String categoryId);

    List<PdCategoryDto.Item> selectList(PdCategoryDto.Request search);

    PdCategoryDto.PageResponse selectPageList(PdCategoryDto.Request search);

    int updateSelective(PdCategory entity);
}
