package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;

import java.util.List;
import java.util.Optional;

/** PmEventItem QueryDSL Custom Repository */
public interface QPmEventItemRepository {

    Optional<PmEventItemDto.Item> selectById(String eventItemId);

    List<PmEventItemDto.Item> selectList(PmEventItemDto.Request search);

    PmEventItemDto.PageResponse selectPageList(PmEventItemDto.Request search);

    int updateSelective(PmEventItem entity);
}
