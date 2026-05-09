package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpWidgetLibMapper {

    DpWidgetLibDto.Item selectById(@Param("id") String id);

    List<DpWidgetLibDto.Item> selectList(DpWidgetLibDto.Request req);

    List<DpWidgetLibDto.Item> selectPageList(DpWidgetLibDto.Request req);

    long selectPageCount(DpWidgetLibDto.Request req);

    int updateSelective(DpWidgetLib entity);
}
