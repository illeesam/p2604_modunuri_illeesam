package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ZzSample0Mapper {
    ZzSample0Dto.Item selectById(String id);
    List<ZzSample0Dto.Item> selectList(ZzSample0Dto.Request req);
    List<ZzSample0Dto.Item> selectPageList(ZzSample0Dto.Request req);
    Integer selectPageCount(ZzSample0Dto.Request req);
    int updateSelective(ZzSample0 entity);
}
