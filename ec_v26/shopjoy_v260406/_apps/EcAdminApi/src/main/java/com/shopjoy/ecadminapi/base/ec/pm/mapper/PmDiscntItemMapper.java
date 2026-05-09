package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmDiscntItemMapper {

    PmDiscntItemDto.Item selectById(@Param("id") String id);

    List<PmDiscntItemDto.Item> selectList(PmDiscntItemDto.Request req);

    List<PmDiscntItemDto.Item> selectPageList(PmDiscntItemDto.Request req);

    long selectPageCount(PmDiscntItemDto.Request req);

    int updateSelective(PmDiscntItem entity);
}
