package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface DpAreaMapper {

    DpAreaDto.Item selectById(@Param("id") String id);

    List<DpAreaDto.Item> selectList(DpAreaDto.Request req);

    List<DpAreaDto.Item> selectPageList(DpAreaDto.Request req);

    long selectPageCount(DpAreaDto.Request req);

    int updateSelective(DpArea entity);
}
