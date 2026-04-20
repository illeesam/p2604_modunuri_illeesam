package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdOrderItemDiscntMapper {

    OdOrderItemDiscntDto selectById(@Param("id") String id);

    List<OdOrderItemDiscntDto> selectList(@Param("p") Map<String, Object> p);

    List<OdOrderItemDiscntDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdOrderItemDiscnt entity);
}
