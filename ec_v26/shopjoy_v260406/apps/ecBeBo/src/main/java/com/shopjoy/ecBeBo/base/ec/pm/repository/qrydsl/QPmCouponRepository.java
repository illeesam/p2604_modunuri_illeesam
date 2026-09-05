package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** PmCoupon QueryDSL Custom Repository */
public interface QPmCouponRepository {

    Optional<PmCouponDto.Item> selectById(String couponId);

    List<PmCouponDto.Item> selectList(PmCouponDto.Request search);

    BasePage<PmCouponDto.Item> selectPageData(PmCouponDto.Request search);

    int updateSelective(PmCoupon entity);

    /** 만료 처리 대상 — 파라미터 3개 이상이라 QueryDSL 사용 */
    List<PmCoupon> selectExpireTargets(String useYn, String excludeStatusCd, LocalDate today);

    /** 만료 D-N 안내 대상 — 파라미터 3개 이상이라 QueryDSL 사용 */
    List<PmCoupon> selectExpiringSoon(String useYn, String couponStatusCd, LocalDate expireTarget);
}
