package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmCouponUsageMapper {

    PmCouponUsageDto selectById(@Param("id") String id);

    List<PmCouponUsageDto> selectList(@Param("p") Map<String, Object> p);

    List<PmCouponUsageDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmCouponUsage entity);
}
