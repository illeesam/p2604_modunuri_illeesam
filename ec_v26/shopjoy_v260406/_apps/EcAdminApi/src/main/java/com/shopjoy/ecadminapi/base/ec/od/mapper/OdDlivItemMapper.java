package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdDlivItemMapper {

    OdDlivItemDto selectById(@Param("id") String id);

    List<OdDlivItemDto> selectList(@Param("p") Map<String, Object> p);

    List<OdDlivItemDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdDlivItem entity);
}
