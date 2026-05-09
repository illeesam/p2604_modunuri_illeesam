package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpPanelItemMapper {

    DpPanelItemDto.Item selectById(@Param("id") String id);

    List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request req);

    List<DpPanelItemDto.Item> selectPageList(DpPanelItemDto.Request req);

    long selectPageCount(DpPanelItemDto.Request req);

    int updateSelective(DpPanelItem entity);
}
