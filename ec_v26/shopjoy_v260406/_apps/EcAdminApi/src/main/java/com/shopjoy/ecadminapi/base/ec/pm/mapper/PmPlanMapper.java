package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmPlanMapper {

    PmPlanDto selectById(@Param("id") String id);

    List<PmPlanDto> selectList(@Param("p") Map<String, Object> p);

    List<PmPlanDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmPlan entity);
}
