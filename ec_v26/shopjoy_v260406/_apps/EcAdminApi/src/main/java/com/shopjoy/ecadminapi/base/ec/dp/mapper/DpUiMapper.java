package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpUiMapper {

    DpUiDto.Item selectById(@Param("id") String id);

    List<DpUiDto.Item> selectList(DpUiDto.Request req);

    List<DpUiDto.Item> selectPageList(DpUiDto.Request req);

    long selectPageCount(DpUiDto.Request req);

    int updateSelective(DpUi entity);
}
