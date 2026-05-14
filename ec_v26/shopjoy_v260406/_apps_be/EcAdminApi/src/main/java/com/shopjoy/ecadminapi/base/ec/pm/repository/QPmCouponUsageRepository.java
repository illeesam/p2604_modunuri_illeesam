package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;

import java.util.List;
import java.util.Optional;

/** PmCouponUsage QueryDSL Custom Repository */
public interface QPmCouponUsageRepository {

    Optional<PmCouponUsageDto.Item> selectById(String usageId);

    List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search);

    PmCouponUsageDto.PageResponse selectPageList(PmCouponUsageDto.Request search);

    int updateSelective(PmCouponUsage entity);
}
