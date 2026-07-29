package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;

import java.util.List;
import java.util.Optional;

/** PmCoupon QueryDSL Custom Repository */
public interface QPmCouponRepository {

    Optional<PmCouponDto.Item> selectById(String couponId);

    List<PmCouponDto.Item> selectList(PmCouponDto.Request search);

    BasePage<PmCouponDto.Item> selectPageData(PmCouponDto.Request search);

    int updateSelective(PmCoupon entity);
}
