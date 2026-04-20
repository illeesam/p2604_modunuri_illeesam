package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DpWidgetLibMapper {

    DpWidgetLibDto selectById(@Param("id") String id);

    List<DpWidgetLibDto> selectList(@Param("p") Map<String, Object> p);

    List<DpWidgetLibDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(DpWidgetLib entity);
}
