package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmCouponService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FO 쿠폰 API — 현재 로그인 회원의 사용 가능 쿠폰
 * GET /api/fo/ec/pm/coupon/available — 미사용 쿠폰 목록
 *
 * 인가: USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/pm/coupon")
@RequiredArgsConstructor
public class FoPmCouponController {

    private final FoPmCouponService service;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<PmCouponIssueDto>>> available(
            @RequestParam(required = false) String siteId) {
        List<PmCouponIssueDto> result = service.getAvailableCoupons(siteId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
