package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdDlivItemMapper {

    OdDlivItemDto.Item selectById(@Param("id") String id);

    List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request req);

    List<OdDlivItemDto.Item> selectPageList(OdDlivItemDto.Request req);

    long selectPageCount(OdDlivItemDto.Request req);

    int updateSelective(OdDlivItem entity);
}
