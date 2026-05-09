package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdCartMapper {

    OdCartDto.Item selectById(@Param("id") String id);

    List<OdCartDto.Item> selectList(OdCartDto.Request req);

    List<OdCartDto.Item> selectPageList(OdCartDto.Request req);

    long selectPageCount(OdCartDto.Request req);

    int updateSelective(OdCart entity);
}
