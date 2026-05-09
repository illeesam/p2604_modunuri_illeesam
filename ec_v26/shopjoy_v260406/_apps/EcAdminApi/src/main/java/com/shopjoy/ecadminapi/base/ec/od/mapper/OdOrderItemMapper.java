package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdOrderItemMapper {

    OdOrderItemDto.Item selectById(@Param("id") String id);

    List<OdOrderItemDto.Item> selectList(OdOrderItemDto.Request req);

    List<OdOrderItemDto.Item> selectPageList(OdOrderItemDto.Request req);

    long selectPageCount(OdOrderItemDto.Request req);

    int updateSelective(OdOrderItem entity);
}
