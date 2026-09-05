package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdCategory;

import java.util.List;
import java.util.Optional;

/** PdCategory QueryDSL Custom Repository */
public interface QPdCategoryRepository {

    Optional<PdCategoryDto.Item> selectById(String categoryId);

    List<PdCategoryDto.Item> selectList(PdCategoryDto.Request search);

    BasePage<PdCategoryDto.Item> selectPageData(PdCategoryDto.Request search);

    int updateSelective(PdCategory entity);

    /** 루트 category + 모든 자손 category_id 수집(트리조회 §14.6.9 — QueryDSL 전체조회 + 자바 BFS) */
    List<String> selectTreeCategoryIds(String rootCategoryId);
}
