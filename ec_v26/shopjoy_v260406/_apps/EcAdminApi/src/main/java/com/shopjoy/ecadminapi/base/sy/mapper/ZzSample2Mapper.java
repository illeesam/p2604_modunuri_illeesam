package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface ZzSample2Mapper {
    ZzSample2Dto selectById(String id);
    List<ZzSample2Dto> selectList(Map<String, Object> p);
    List<ZzSample2Dto> selectPageList(Map<String, Object> p);
    Integer selectPageCount(Map<String, Object> p);
    int updateSelective(ZzSample2 entity);
}
