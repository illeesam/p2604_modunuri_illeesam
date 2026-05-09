package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ZzSample1Mapper {
    ZzSample1Dto.Item selectById(String id);
    List<ZzSample1Dto.Item> selectList(ZzSample1Dto.Request req);
    List<ZzSample1Dto.Item> selectPageList(ZzSample1Dto.Request req);
    Integer selectPageCount(ZzSample1Dto.Request req);
    int updateSelective(ZzSample1 entity);
}
