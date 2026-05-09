package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmPlanItemMapper {

    PmPlanItemDto.Item selectById(@Param("id") String id);

    List<PmPlanItemDto.Item> selectList(PmPlanItemDto.Request req);

    List<PmPlanItemDto.Item> selectPageList(PmPlanItemDto.Request req);

    long selectPageCount(PmPlanItemDto.Request req);

    int updateSelective(PmPlanItem entity);
}
