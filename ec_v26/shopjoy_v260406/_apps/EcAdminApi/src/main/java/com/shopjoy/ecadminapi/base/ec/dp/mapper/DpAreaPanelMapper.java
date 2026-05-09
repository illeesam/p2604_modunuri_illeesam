package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpAreaPanelMapper {

    DpAreaPanelDto.Item selectById(@Param("id") String id);

    List<DpAreaPanelDto.Item> selectList(DpAreaPanelDto.Request req);

    List<DpAreaPanelDto.Item> selectPageList(DpAreaPanelDto.Request req);

    long selectPageCount(DpAreaPanelDto.Request req);

    int updateSelective(DpAreaPanel entity);
}
