package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;

import java.util.List;
import java.util.Optional;

/** PdTag QueryDSL Custom Repository */
public interface QPdTagRepository {

    Optional<PdTagDto.Item> selectById(String tagId);

    List<PdTagDto.Item> selectList(PdTagDto.Request search);

    PdTagDto.PageResponse selectPageList(PdTagDto.Request search);

    int updateSelective(PdTag entity);
}
