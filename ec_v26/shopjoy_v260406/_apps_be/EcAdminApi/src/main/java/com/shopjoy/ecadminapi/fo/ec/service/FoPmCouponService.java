package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponIssueMapper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * FO 쿠폰 서비스 — 현재 회원의 사용 가능 쿠폰 조회
 * URL: /api/fo/ec/pm/coupon
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPmCouponService {

    private final PmCouponIssueMapper pmCouponIssueMapper;

    /** getAvailableCoupons — 조회 */
    public List<PmCouponIssueDto.Item> getAvailableCoupons(PmCouponIssueDto.Request req) {
        if (req == null) req = new PmCouponIssueDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        req.setUseYn("N");
        return pmCouponIssueMapper.selectList(VoUtil.voToMap(req));
    }
}
