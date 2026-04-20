package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponIssueMapper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * FO 쿠폰 서비스 — 현재 회원의 사용 가능 쿠폰 조회
 * URL: /api/fo/ec/pm/coupon
 */
@Service
@RequiredArgsConstructor
public class FoPmCouponService {

    private final PmCouponIssueMapper mapper;

    @Transactional(readOnly = true)
    public List<PmCouponIssueDto> getAvailableCoupons(String siteId) {
        String memberId = SecurityUtil.currentUserId();
        return mapper.selectList(Map.of(
            "memberId", memberId,
            "useYn",    "N",
            "siteId",   siteId != null ? siteId : ""
        ));
    }
}
