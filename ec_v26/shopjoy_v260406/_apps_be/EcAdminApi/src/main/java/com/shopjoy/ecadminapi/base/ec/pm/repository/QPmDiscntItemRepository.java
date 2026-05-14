package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;

import java.util.List;
import java.util.Optional;

/** PmDiscntItem QueryDSL Custom Repository */
public interface QPmDiscntItemRepository {

    Optional<PmDiscntItemDto.Item> selectById(String discntItemId);

    List<PmDiscntItemDto.Item> selectList(PmDiscntItemDto.Request search);

    PmDiscntItemDto.PageResponse selectPageList(PmDiscntItemDto.Request search);

    int updateSelective(PmDiscntItem entity);
}
