package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DpPanelItemMapper {

    DpPanelItemDto selectById(@Param("id") String id);

    List<DpPanelItemDto> selectList(@Param("p") Map<String, Object> p);

    List<DpPanelItemDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(DpPanelItem entity);
}
