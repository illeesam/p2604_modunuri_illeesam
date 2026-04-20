package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DpWidgetMapper {

    DpWidgetDto selectById(@Param("id") String id);

    List<DpWidgetDto> selectList(@Param("p") Map<String, Object> p);

    List<DpWidgetDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(DpWidget entity);
}
