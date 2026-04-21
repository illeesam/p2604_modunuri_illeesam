package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface ZzSample1Mapper {
    ZzSample1Dto selectById(String id);
    List<ZzSample1Dto> selectList(Map<String, Object> p);
    List<ZzSample1Dto> selectPageList(Map<String, Object> p);
    Integer selectPageCount(Map<String, Object> p);
    int updateSelective(ZzSample1 entity);
}
