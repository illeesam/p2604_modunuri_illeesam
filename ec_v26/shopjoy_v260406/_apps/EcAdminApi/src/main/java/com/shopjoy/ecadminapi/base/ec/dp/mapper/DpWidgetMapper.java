package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpWidgetMapper {

    DpWidgetDto.Item selectById(@Param("id") String id);

    List<DpWidgetDto.Item> selectList(DpWidgetDto.Request req);

    List<DpWidgetDto.Item> selectPageList(DpWidgetDto.Request req);

    long selectPageCount(DpWidgetDto.Request req);

    int updateSelective(DpWidget entity);
}
