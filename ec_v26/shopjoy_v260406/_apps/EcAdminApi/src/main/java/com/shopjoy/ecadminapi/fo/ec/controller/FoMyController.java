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
 * FO 마이페이지 API (프론트엔드 경로 호환)
 * GET  /api/fo/my/order/list           — 내 주문 목록
 * GET  /api/fo/my/claim/list           — 내 클레임 목록
 * GET  /api/fo/my/coupon/list          — 내 쿠폰 목록
 * GET  /api/fo/my/cash/info            — 내 캐시 정보
 * GET  /api/fo/my/inquiry/list         — 내 문의 목록
 * GET  /api/fo/my/chat/list            — 내 채팅 목록
 *
 * 인가: 전체 MEMBER (로그인 필수)
 */
@RestController
@RequestMapping("/api/fo/my")
@RequiredArgsConstructor
@FoOnly
public class FoMyController {

    private final FoMyPageService service;

    @GetMapping("/order/list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrders(
            @RequestParam Map<String, Object> p) {
        List<OdOrderDto> orders = service.getMyOrders(p);
        Map<String, Object> result = new HashMap<>();
        result.put("data", orders);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/claim/list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClaims(
            @RequestParam Map<String, Object> p) {
        List<OdClaimDto> claims = service.getMyClaims(p);
        Map<String, Object> result = new HashMap<>();
        result.put("data", claims);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/coupon/list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCoupons(
            @RequestParam Map<String, Object> p) {
        List<PmCouponDto> coupons = service.getMyCoupons(p);
        Map<String, Object> result = new HashMap<>();
        result.put("data", coupons);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/cash/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCashInfo() {
        List<PmCacheDto> cacheHistory = service.getMyCacheHistory(new HashMap<>());

        Map<String, Object> cashInfo = new HashMap<>();
        // 캐시 잔액은 service에서 가져와야 함 (별도 메서드 필요)
        // 임시로 0으로 설정, 실제 구현 필요
        cashInfo.put("balance", 0);
        cashInfo.put("history", cacheHistory);

        Map<String, Object> result = new HashMap<>();
        result.put("data", cashInfo);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/inquiry/list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInquiries(
            @RequestParam Map<String, Object> p) {
        // 문의 목록 조회 (SyContact 또는 별도 서비스 필요)
        // 임시로 빈 리스트 반환
        Map<String, Object> result = new HashMap<>();
        result.put("data", List.of());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/chat/list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChats(
            @RequestParam Map<String, Object> p) {
        // 채팅 목록 조회 (CmChatt 또는 별도 서비스 필요)
        // 임시로 빈 리스트 반환
        Map<String, Object> result = new HashMap<>();
        result.put("data", List.of());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
