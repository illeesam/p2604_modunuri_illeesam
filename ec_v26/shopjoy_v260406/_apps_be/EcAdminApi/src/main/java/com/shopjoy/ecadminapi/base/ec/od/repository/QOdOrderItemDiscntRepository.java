package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;

import java.util.List;
import java.util.Optional;

/** OdOrderItemDiscnt QueryDSL Custom Repository */
public interface QOdOrderItemDiscntRepository {

    Optional<OdOrderItemDiscntDto.Item> selectById(String itemDiscntId);

    List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request search);

    OdOrderItemDiscntDto.PageResponse selectPageList(OdOrderItemDiscntDto.Request search);

    int updateSelective(OdOrderItemDiscnt entity);
}
