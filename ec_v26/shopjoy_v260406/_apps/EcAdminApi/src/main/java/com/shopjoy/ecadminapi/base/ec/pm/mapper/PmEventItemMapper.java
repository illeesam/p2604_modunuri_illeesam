package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmEventItemMapper {

    PmEventItemDto.Item selectById(@Param("id") String id);

    List<PmEventItemDto.Item> selectList(PmEventItemDto.Request req);

    List<PmEventItemDto.Item> selectPageList(PmEventItemDto.Request req);

    long selectPageCount(PmEventItemDto.Request req);

    int updateSelective(PmEventItem entity);
}
