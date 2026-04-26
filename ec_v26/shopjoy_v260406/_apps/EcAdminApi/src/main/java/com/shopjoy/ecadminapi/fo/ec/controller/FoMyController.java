package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.auth.annotation.FoOnly;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoMyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 마이페이지 API
 * GET  /api/fo/my/order/list   — 내 주문 목록
 * GET  /api/fo/my/claim/list   — 내 클레임 목록
 * GET  /api/fo/my/coupon/list  — 내 쿠폰 목록
 * GET  /api/fo/my/cash/info    — 내 캐시 정보
 * GET  /api/fo/my/inquiry/list — 내 문의 목록
 * GET  /api/fo/my/chat/list    — 내 채팅 목록
 *
 * 인가: MEMBER (로그인 필수)
 * 응답: ApiResponse<List<T>> → res.data.data 로 접근
 */
@RestController
@RequestMapping("/api/fo/my")
@RequiredArgsConstructor
@FoOnly
public class FoMyController {

    private final FoMyPageService service;

    @GetMapping("/order/list")
    public ResponseEntity<ApiResponse<List<OdOrderDto>>> getOrders(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyOrders(p)));
    }

    @GetMapping("/claim/list")
    public ResponseEntity<ApiResponse<List<OdClaimDto>>> getClaims(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyClaims(p)));
    }

    @GetMapping("/coupon/list")
    public ResponseEntity<ApiResponse<List<PmCouponDto>>> getCoupons(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyCoupons(p)));
    }

    @GetMapping("/cash/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCashInfo() {
        List<PmCacheDto> history = service.getMyCacheHistory(new HashMap<>());
        Map<String, Object> cashInfo = new HashMap<>();
        cashInfo.put("balance", 0);
        cashInfo.put("history", history);
        return ResponseEntity.ok(ApiResponse.ok(cashInfo));
    }

    @GetMapping("/inquiry/list")
    public ResponseEntity<ApiResponse<List<Object>>> getInquiries(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(List.of()));
    }

    @GetMapping("/chat/list")
    public ResponseEntity<ApiResponse<List<Object>>> getChats(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(List.of()));
    }
}
