package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmEventMapper {

    PmEventDto.Item selectById(@Param("id") String id);

    List<PmEventDto.Item> selectList(PmEventDto.Request req);

    List<PmEventDto.Item> selectPageList(PmEventDto.Request req);

    long selectPageCount(PmEventDto.Request req);

    int updateSelective(PmEvent entity);
}
