package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
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
public class FoMyController {

    private final FoMyPageService foMyPageService;

    /** getOrders — 조회 */
    @GetMapping("/order/list")
    public ResponseEntity<ApiResponse<List<OdOrderDto.Item>>> getOrders(@jakarta.validation.Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyOrders(req)));
    }

    /** getClaims — 조회 */
    @GetMapping("/claim/list")
    public ResponseEntity<ApiResponse<List<OdClaimDto.Item>>> getClaims(@jakarta.validation.Valid @ModelAttribute OdClaimDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyClaims(req)));
    }

    /** getCoupons — 조회 */
    @GetMapping("/coupon/list")
    public ResponseEntity<ApiResponse<List<PmCouponDto.Item>>> getCoupons(@jakarta.validation.Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyCoupons(req)));
    }

    /** getCashInfo — 조회 (history 는 기간 검색 지원: dateType/dateStart/dateEnd) */
    @GetMapping("/cash/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCashInfo(@jakarta.validation.Valid @ModelAttribute PmCacheDto.Request req) {
        List<PmCacheDto.Item> history = foMyPageService.getMyCacheHistory(req);
        Map<String, Object> cashInfo = new HashMap<>();
        cashInfo.put("balance", 0);
        cashInfo.put("history", history);
        return ResponseEntity.ok(ApiResponse.ok(cashInfo));
    }

    /** getInquiries — 조회 (내 1:1 문의 목록, 기간/상태 검색 지원) */
    @GetMapping("/inquiry/list")
    public ResponseEntity<ApiResponse<List<SyContactDto.Item>>> getInquiries(@jakarta.validation.Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyInquiries(req)));
    }

    /** getChats — 조회 (내 채팅방 목록, 기간 검색 지원) */
    @GetMapping("/chat/list")
    public ResponseEntity<ApiResponse<List<CmChattRoomDto.Item>>> getChats(@jakarta.validation.Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyChats(req)));
    }
}
