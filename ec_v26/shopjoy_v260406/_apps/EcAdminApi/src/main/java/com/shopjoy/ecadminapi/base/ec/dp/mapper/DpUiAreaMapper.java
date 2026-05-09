package com.shopjoy.ecadminapi.base.ec.dp.mapper;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface DpUiAreaMapper {

    DpUiAreaDto.Item selectById(@Param("id") String id);

    List<DpUiAreaDto.Item> selectList(Map<String, Object> p);

    List<DpUiAreaDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(DpUiArea entity);
}
