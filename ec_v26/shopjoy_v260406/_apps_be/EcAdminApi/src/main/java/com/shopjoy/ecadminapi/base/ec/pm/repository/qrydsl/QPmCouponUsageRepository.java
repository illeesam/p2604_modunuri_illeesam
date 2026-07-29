package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;

import java.util.List;
import java.util.Optional;

/** PmCouponUsage QueryDSL Custom Repository */
public interface QPmCouponUsageRepository {

    Optional<PmCouponUsageDto.Item> selectById(String usageId);

    List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search);

    BasePage<PmCouponUsageDto.Item> selectPageData(PmCouponUsageDto.Request search);

    int updateSelective(PmCouponUsage entity);
}
