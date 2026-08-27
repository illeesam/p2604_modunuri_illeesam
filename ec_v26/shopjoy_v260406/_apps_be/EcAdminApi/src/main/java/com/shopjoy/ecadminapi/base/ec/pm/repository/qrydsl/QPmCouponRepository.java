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

    /** 만료 처리 대상 — useYn=Y, EXPIRED 아님, validTo < today (mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findExpireTargets 대체 (2026-08-27) */
    List<PmCoupon> selectExpireTargets(java.time.LocalDate today);

    /** 만료 D-N 안내 대상 — useYn=Y, ACTIVE, validTo = expireTarget (관리 엔티티 그대로 반환).
     *  base 의 findExpiringSoon 대체 (2026-08-27) */
    List<PmCoupon> selectExpiringSoon(java.time.LocalDate expireTarget);
}
