package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.auth.annotation.FoOnly;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * FO 대시보드 API (로그인 회원용)
 * GET /api/fo/ec/cm/dashboard/my — 내 활동 요약
 *
 * 인가: FO_ONLY (로그인 회원)
 * TODO: 더미 데이터 → 실 서비스(SecurityUtil.currentUserId() 기반) 연결 필요
 */
@RestController
@RequestMapping("/api/fo/ec/cm/dashboard")
@FoOnly
public class FoCmDashboardController {

    /** 내 활동 요약 */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Map<String, Object>>> my() {
        Map<String, Object> result = Map.of(
            "cashBalance",     15_000L,       // 캐시 잔액
            "couponCount",     3,             // 사용 가능 쿠폰 수
            "likeCount",       12,            // 찜 상품 수
            "orderStatus",     Map.of(
                "PAID",        1,             // 결제완료 (배송 준비 중)
                "PREPARING",   0,
                "SHIPPED",     2,             // 배송 중
                "COMPLT",      8              // 배송 완료
            ),
            "claimPending",    0,             // 처리 중 클레임 수
            "recentOrders",    List.of(
                myOrder("ORD20260421008", "무선 이어폰 외 1건", 89_000L,  "SHIPPED",  LocalDateTime.now().minusDays(1)),
                myOrder("ORD20260418003", "캐시미어 니트",       125_000L, "SHIPPED",  LocalDateTime.now().minusDays(3)),
                myOrder("ORD20260412011", "운동화",              72_000L,  "COMPLT",   LocalDateTime.now().minusDays(9))
            ),
            "asOf", LocalDateTime.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> myOrder(String orderId, String prodSummary, long orderAmt,
                                        String statusCd, LocalDateTime regDate) {
        return Map.of(
            "orderId",       orderId,
            "prodSummary",   prodSummary,
            "orderAmt",      orderAmt,
            "orderStatusCd", statusCd,
            "regDate",       regDate.toString()
        );
    }
}
