package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdOrderItemDiscntMapper {

    OdOrderItemDiscntDto.Item selectById(@Param("id") String id);

    List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request req);

    List<OdOrderItemDiscntDto.Item> selectPageList(OdOrderItemDiscntDto.Request req);

    long selectPageCount(OdOrderItemDiscntDto.Request req);

    int updateSelective(OdOrderItemDiscnt entity);
}
