package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmPlanItemMapper {

    PmPlanItemDto selectById(@Param("id") String id);

    List<PmPlanItemDto> selectList(@Param("p") Map<String, Object> p);

    List<PmPlanItemDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmPlanItem entity);
}
