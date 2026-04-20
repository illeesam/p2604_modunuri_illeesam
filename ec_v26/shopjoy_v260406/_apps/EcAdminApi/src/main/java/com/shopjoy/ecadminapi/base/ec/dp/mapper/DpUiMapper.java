package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DpUiMapper {

    DpUiDto selectById(@Param("id") String id);

    List<DpUiDto> selectList(@Param("p") Map<String, Object> p);

    List<DpUiDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(DpUi entity);
}
