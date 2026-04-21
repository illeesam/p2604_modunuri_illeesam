package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * BO 대시보드 API
 * GET /api/bo/ec/cm/dashboard/summary       — 주요 지표 요약
 * GET /api/bo/ec/cm/dashboard/recent-orders — 최근 주문 목록
 * GET /api/bo/ec/cm/dashboard/chart         — 기간별 매출 차트
 * GET /api/bo/ec/cm/dashboard/pending       — 처리 대기 현황
 *
 * 인가: BO_ONLY (관리자)
 * TODO: 더미 데이터 → 실 서비스 연결 필요
 */
@RestController
@RequestMapping("/api/bo/ec/cm/dashboard")
@BoOnly
public class BoCmDashboardController {

    /** 주요 지표 요약 */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        Map<String, Object> result = Map.of(
            "today",    Map.of(
                "orderCount",   42,
                "orderAmt",     3_850_000L,
                "newMember",    7,
                "visitCount",   312
            ),
            "week",     Map.of(
                "orderCount",   278,
                "orderAmt",     24_600_000L,
                "newMember",    53,
                "visitCount",   2_140
            ),
            "month",    Map.of(
                "orderCount",   1_024,
                "orderAmt",     98_340_000L,
                "newMember",    210,
                "visitCount",   9_870
            ),
            "asOf",     LocalDateTime.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 최근 주문 10건 */
    @GetMapping("/recent-orders")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> recentOrders() {
        List<Map<String, Object>> result = List.of(
            order("ORD20260421001", "홍길동", 125_000L, "PAID"),
            order("ORD20260421002", "김철수", 89_000L,  "PREPARING"),
            order("ORD20260421003", "이영희", 245_000L, "SHIPPED"),
            order("ORD20260421004", "박민준", 67_000L,  "PAID"),
            order("ORD20260421005", "최수진", 310_000L, "COMPLT"),
            order("ORD20260421006", "정우성", 58_000L,  "PAID"),
            order("ORD20260421007", "강지원", 190_000L, "PREPARING"),
            order("ORD20260421008", "윤서연", 420_000L, "SHIPPED"),
            order("ORD20260421009", "임태양", 72_000L,  "PAID"),
            order("ORD20260421010", "한소희", 155_000L, "COMPLT")
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 최근 7일 일별 매출 차트 */
    @GetMapping("/chart")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chart() {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> daily = List.of(
            day(today.minusDays(6), 18, 1_620_000L),
            day(today.minusDays(5), 25, 2_340_000L),
            day(today.minusDays(4), 31, 2_890_000L),
            day(today.minusDays(3), 22, 2_010_000L),
            day(today.minusDays(2), 38, 3_420_000L),
            day(today.minusDays(1), 45, 4_150_000L),
            day(today,              42, 3_850_000L)
        );
        return ResponseEntity.ok(ApiResponse.ok(Map.of("daily", daily)));
    }

    /** 처리 대기 현황 */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pending() {
        Map<String, Object> result = Map.of(
            "orderPending",    5,   // 결제 확인 대기
            "claimPending",    3,   // 클레임 처리 대기
            "dlivPending",     8,   // 출고 대기
            "contactPending",  12,  // 미답변 문의
            "chattPending",    2,   // 미확인 채팅
            "reviewPending",   7    // 미승인 리뷰
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> order(String orderId, String memberNm, long orderAmt, String statusCd) {
        return Map.of(
            "orderId",      orderId,
            "memberNm",     memberNm,
            "orderAmt",     orderAmt,
            "orderStatusCd", statusCd,
            "regDate",      LocalDateTime.now().minusMinutes((long)(Math.random() * 480)).toString()
        );
    }

    private Map<String, Object> day(LocalDate date, int orderCount, long orderAmt) {
        return Map.of(
            "date",       date.toString(),
            "orderCount", orderCount,
            "orderAmt",   orderAmt
        );
    }
}
