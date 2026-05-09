package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmEventBenefitMapper {

    PmEventBenefitDto.Item selectById(@Param("id") String id);

    List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request req);

    List<PmEventBenefitDto.Item> selectPageList(PmEventBenefitDto.Request req);

    long selectPageCount(PmEventBenefitDto.Request req);

    int updateSelective(PmEventBenefit entity);
}
