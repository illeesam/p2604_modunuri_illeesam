package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponUsage;

import java.util.List;
import java.util.Optional;

/** PmCouponUsage QueryDSL Custom Repository */
public interface QPmCouponUsageRepository {

    Optional<PmCouponUsageDto.Item> selectById(String couponUsageId);

    List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search);

    BasePage<PmCouponUsageDto.Item> selectPageData(PmCouponUsageDto.Request search);

    int updateSelective(PmCouponUsage entity);
}
