package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DpAreaPanelMapper {

    DpAreaPanelDto selectById(@Param("id") String id);

    List<DpAreaPanelDto> selectList(@Param("p") Map<String, Object> p);

    List<DpAreaPanelDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(DpAreaPanel entity);
}
