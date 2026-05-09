package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.fo.ec.service.FoMbLikeService;
import com.shopjoy.ecadminapi.fo.ec.service.FoOdOrderService;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmCacheService;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmCouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * FO 대시보드 API (로그인 회원용)
 * GET /api/fo/ec/cm/dashboard/my — 내 활동 요약
 *
 * 인가: FO_ONLY (로그인 회원)
 *
 * 응답 구조:
 *   { cashBalance, couponCount, likeCount, orderStatus:{PAID,PREPARING,SHIPPED,COMPLT},
 *     claimPending, recentOrders:[...], asOf }
 */
@RestController
@RequestMapping("/api/fo/ec/cm/dashboard")
@RequiredArgsConstructor
public class FoCmDashboardController {

    private final FoOdOrderService   orderService;
    private final FoMbLikeService    likeService;
    private final FoPmCouponService  couponService;
    private final FoPmCacheService   cacheService;

    /** 내 활동 요약 — 로그인 회원의 최근 주문/찜/쿠폰/캐시 잔액 통합 응답 */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Map<String, Object>>> my() {
        String memberId = SecurityUtil.getAuthUser().authId();

        Map<String, Object> p = new HashMap<>();
        p.put("memberId", memberId);

        // 1) 캐시 잔액
        long cashBalance = safeLong(() -> cacheService.getBalance(new HashMap<>(p)));

        // 2) 사용 가능 쿠폰 수
        List<PmCouponIssueDto> coupons = safeList(() -> couponService.getAvailableCoupons(new HashMap<>(p)));
        int couponCount = coupons != null ? coupons.size() : 0;

        // 3) 찜 상품 수
        List<MbLikeDto.Item> likes = safeList(() -> {
            MbLikeDto.Request r = new MbLikeDto.Request();
            return likeService.getMyLikes(r);
        });
        int likeCount = likes != null ? likes.size() : 0;

        // 4) 주문 — 최근 목록 + 상태 카운트 (한 번 조회 후 분류)
        List<OdOrderDto> myOrders = safeList(() -> orderService.getMyOrders(new HashMap<>(p)));

        Map<String, Long> orderStatus = new LinkedHashMap<>();
        orderStatus.put("PAID",      countByStatus(myOrders, "PAID"));
        orderStatus.put("PREPARING", countByStatus(myOrders, "PREPARING"));
        orderStatus.put("SHIPPED",   countByStatus(myOrders, "SHIPPED"));
        orderStatus.put("COMPLT",    countByStatus(myOrders, "COMPLT"));

        long claimPending = myOrders == null ? 0L :
            myOrders.stream().filter(o -> "CLAIM_PENDING".equals(o.getOrderStatusCd())).count();

        List<Map<String, Object>> recentOrders = myOrders == null ? List.of() :
            myOrders.stream().limit(5).map(this::toRecentOrder).collect(Collectors.toList());

        // 5) 통합 응답
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cashBalance",  cashBalance);
        result.put("couponCount",  couponCount);
        result.put("likeCount",    likeCount);
        result.put("orderStatus",  orderStatus);
        result.put("claimPending", claimPending);
        result.put("recentOrders", recentOrders);
        result.put("asOf",         LocalDateTime.now().toString());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** toRecentOrder — 변환 */
    private Map<String, Object> toRecentOrder(OdOrderDto o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("orderId",       o.getOrderId());
        // 화면 호환: 기존 prodSummary 자리는 향후 OrderItem 조인으로 채울 예정
        // 현재는 주문ID 를 폴백 텍스트로 사용 (리스트 표시 가능)
        m.put("prodSummary",   o.getOrderId());
        m.put("orderAmt",      o.getPayAmt() != null ? o.getPayAmt() : o.getTotalAmt());
        m.put("orderStatusCd", o.getOrderStatusCd());
        m.put("regDate",       o.getRegDate() != null ? o.getRegDate().toString() : null);
        return m;
    }

    /** countByStatus — 건수 */
    private static long countByStatus(List<OdOrderDto> orders, String statusCd) {
        if (orders == null) return 0L;
        return orders.stream().filter(o -> statusCd.equals(o.getOrderStatusCd())).count();
    }

    /** safeLong */
    private static long safeLong(java.util.function.Supplier<Long> s) {
        try { Long v = s.get(); return v != null ? v : 0L; } catch (Exception e) { return 0L; }
    }

    /** safeList */
    private static <T> List<T> safeList(java.util.function.Supplier<List<T>> s) {
        try { List<T> v = s.get(); return v != null ? v : List.of(); } catch (Exception e) { return List.of(); }
    }
}
