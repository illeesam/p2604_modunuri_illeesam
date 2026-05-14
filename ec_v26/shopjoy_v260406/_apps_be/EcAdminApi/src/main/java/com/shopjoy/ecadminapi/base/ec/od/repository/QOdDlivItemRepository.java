package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;

import java.util.List;
import java.util.Optional;

/** OdDlivItem QueryDSL Custom Repository */
public interface QOdDlivItemRepository {

    Optional<OdDlivItemDto.Item> selectById(String dlivItemId);

    List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search);

    OdDlivItemDto.PageResponse selectPageList(OdDlivItemDto.Request search);

    int updateSelective(OdDlivItem entity);
}
