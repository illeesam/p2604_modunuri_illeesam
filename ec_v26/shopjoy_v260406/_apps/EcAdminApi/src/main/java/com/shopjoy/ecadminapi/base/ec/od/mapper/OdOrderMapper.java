package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdOrderMapper {

    OdOrderDto.Item selectById(@Param("id") String id);

    List<OdOrderDto.Item> selectList(OdOrderDto.Request req);

    List<OdOrderDto.Item> selectPageList(OdOrderDto.Request req);

    long selectPageCount(OdOrderDto.Request req);

    int updateSelective(OdOrder entity);
}
