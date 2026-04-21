package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface ZzSample0Mapper {
    ZzSample0Dto selectById(String id);
    List<ZzSample0Dto> selectList(Map<String, Object> p);
    List<ZzSample0Dto> selectPageList(Map<String, Object> p);
    Integer selectPageCount(Map<String, Object> p);
    int updateSelective(ZzSample0 entity);
}
