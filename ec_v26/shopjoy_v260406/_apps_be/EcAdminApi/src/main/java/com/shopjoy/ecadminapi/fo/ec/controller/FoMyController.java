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

    /** getOrdersPage — 서버사이드 페이징 조회 (pageNo/pageSize + 상태/기간 검색) */
    @GetMapping("/order/page")
    public ResponseEntity<ApiResponse<OdOrderDto.PageResponse>> getOrdersPage(@jakarta.validation.Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyOrdersPage(req)));
    }

    /** getClaims — 조회 */
    @GetMapping("/claim/list")
    public ResponseEntity<ApiResponse<List<OdClaimDto.Item>>> getClaims(@jakarta.validation.Valid @ModelAttribute OdClaimDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyClaims(req)));
    }

    /** getClaimsPage — 서버사이드 페이징 조회 (pageNo/pageSize + 유형/상태/기간 검색) */
    @GetMapping("/claim/page")
    public ResponseEntity<ApiResponse<OdClaimDto.PageResponse>> getClaimsPage(@jakarta.validation.Valid @ModelAttribute OdClaimDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyClaimsPage(req)));
    }

    /** getCoupons — 조회 */
    @GetMapping("/coupon/list")
    public ResponseEntity<ApiResponse<List<PmCouponDto.Item>>> getCoupons(@jakarta.validation.Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyCoupons(req)));
    }

    /** getCouponsPage — 서버사이드 페이징 조회 (pageNo/pageSize + 상태/기간 검색) */
    @GetMapping("/coupon/page")
    public ResponseEntity<ApiResponse<PmCouponDto.PageResponse>> getCouponsPage(@jakarta.validation.Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyCouponsPage(req)));
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

    /** getCashPage — 서버사이드 페이징 조회 (balance + 페이징된 history) */
    @GetMapping("/cash/page")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCashPage(@jakarta.validation.Valid @ModelAttribute PmCacheDto.Request req) {
        PmCacheDto.PageResponse page = foMyPageService.getMyCacheHistoryPage(req);
        Map<String, Object> cashInfo = new HashMap<>();
        cashInfo.put("balance", 0);
        cashInfo.put("history", page);
        return ResponseEntity.ok(ApiResponse.ok(cashInfo));
    }

    /** getInquiries — 조회 (내 1:1 문의 목록, 기간/상태 검색 지원) */
    @GetMapping("/inquiry/list")
    public ResponseEntity<ApiResponse<List<SyContactDto.Item>>> getInquiries(@jakarta.validation.Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyInquiries(req)));
    }

    /** getInquiriesPage — 서버사이드 페이징 조회 (pageNo/pageSize + 상태/기간 검색) */
    @GetMapping("/inquiry/page")
    public ResponseEntity<ApiResponse<SyContactDto.PageResponse>> getInquiriesPage(@jakarta.validation.Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyInquiriesPage(req)));
    }

    /** getChats — 조회 (내 채팅방 목록, 기간 검색 지원) */
    @GetMapping("/chat/list")
    public ResponseEntity<ApiResponse<List<CmChattRoomDto.Item>>> getChats(@jakarta.validation.Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyChats(req)));
    }

    /** getChatsPage — 서버사이드 페이징 조회 (pageNo/pageSize + 기간 검색) */
    @GetMapping("/chat/page")
    public ResponseEntity<ApiResponse<CmChattRoomDto.PageResponse>> getChatsPage(@jakarta.validation.Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyChatsPage(req)));
    }
}
