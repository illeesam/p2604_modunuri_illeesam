package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmCouponUsageMapper {

    PmCouponUsageDto.Item selectById(@Param("id") String id);

    List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request req);

    List<PmCouponUsageDto.Item> selectPageList(PmCouponUsageDto.Request req);

    long selectPageCount(PmCouponUsageDto.Request req);

    int updateSelective(PmCouponUsage entity);
}
