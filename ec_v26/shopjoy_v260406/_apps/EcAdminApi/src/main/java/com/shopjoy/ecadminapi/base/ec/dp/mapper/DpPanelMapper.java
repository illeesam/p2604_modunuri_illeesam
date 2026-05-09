package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpPanelMapper {

    DpPanelDto.Item selectById(@Param("id") String id);

    List<DpPanelDto.Item> selectList(DpPanelDto.Request req);

    List<DpPanelDto.Item> selectPageList(DpPanelDto.Request req);

    long selectPageCount(DpPanelDto.Request req);

    int updateSelective(DpPanel entity);
}
