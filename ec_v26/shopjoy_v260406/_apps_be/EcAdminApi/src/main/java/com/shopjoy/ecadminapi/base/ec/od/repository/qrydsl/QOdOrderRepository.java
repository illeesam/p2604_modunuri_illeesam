package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;

import java.util.List;
import java.util.Optional;

/** OdOrder QueryDSL Custom Repository */
public interface QOdOrderRepository {

    Optional<OdOrderDto.Item> selectById(String orderId);

    List<OdOrderDto.Item> selectList(OdOrderDto.Request search);

    OdOrderDto.PageResponse selectPageList(OdOrderDto.Request search);

    int updateSelective(OdOrder entity);
}
