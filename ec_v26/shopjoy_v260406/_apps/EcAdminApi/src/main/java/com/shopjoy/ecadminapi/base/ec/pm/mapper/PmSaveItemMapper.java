package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmSaveItemMapper {

    PmSaveItemDto.Item selectById(@Param("id") String id);

    List<PmSaveItemDto.Item> selectList(PmSaveItemDto.Request req);

    List<PmSaveItemDto.Item> selectPageList(PmSaveItemDto.Request req);

    long selectPageCount(PmSaveItemDto.Request req);

    int updateSelective(PmSaveItem entity);
}
