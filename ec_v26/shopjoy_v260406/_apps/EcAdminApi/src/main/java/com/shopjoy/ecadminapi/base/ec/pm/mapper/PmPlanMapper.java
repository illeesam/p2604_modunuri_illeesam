package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmPlanMapper {

    PmPlanDto.Item selectById(@Param("id") String id);

    List<PmPlanDto.Item> selectList(PmPlanDto.Request req);

    List<PmPlanDto.Item> selectPageList(PmPlanDto.Request req);

    long selectPageCount(PmPlanDto.Request req);

    int updateSelective(PmPlan entity);
}
