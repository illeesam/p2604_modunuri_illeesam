package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;

import java.util.List;
import java.util.Optional;

/** OdOrderItem QueryDSL Custom Repository */
public interface QOdOrderItemRepository {

    Optional<OdOrderItemDto.Item> selectById(String orderItemId);

    List<OdOrderItemDto.Item> selectList(OdOrderItemDto.Request search);

    OdOrderItemDto.PageResponse selectPageList(OdOrderItemDto.Request search);

    int updateSelective(OdOrderItem entity);
}
