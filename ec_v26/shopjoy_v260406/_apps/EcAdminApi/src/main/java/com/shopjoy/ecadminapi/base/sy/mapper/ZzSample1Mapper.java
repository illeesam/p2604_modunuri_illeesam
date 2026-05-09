package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;

import java.util.List;

@Mapper
public interface ZzSample1Mapper {
    ZzSample1Dto.Item selectById(String id);
    List<ZzSample1Dto.Item> selectList(Map<String, Object> p);
    List<ZzSample1Dto.Item> selectPageList(Map<String, Object> p);
    Integer selectPageCount(Map<String, Object> p);
    int updateSelective(ZzSample1 entity);
}
