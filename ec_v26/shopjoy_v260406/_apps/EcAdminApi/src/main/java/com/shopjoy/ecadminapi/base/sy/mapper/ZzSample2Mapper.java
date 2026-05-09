package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ZzSample2Mapper {
    ZzSample2Dto.Item selectById(String id);
    List<ZzSample2Dto.Item> selectList(ZzSample2Dto.Request req);
    List<ZzSample2Dto.Item> selectPageList(ZzSample2Dto.Request req);
    Integer selectPageCount(ZzSample2Dto.Request req);
    int updateSelective(ZzSample2 entity);
}
