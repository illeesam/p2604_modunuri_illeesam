package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpUiAreaMapper {

    DpUiAreaDto.Item selectById(@Param("id") String id);

    List<DpUiAreaDto.Item> selectList(DpUiAreaDto.Request req);

    List<DpUiAreaDto.Item> selectPageList(DpUiAreaDto.Request req);

    long selectPageCount(DpUiAreaDto.Request req);

    int updateSelective(DpUiArea entity);
}
