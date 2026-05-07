package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.fo.ec.service.FoOdOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 주문 API — 현재 로그인 회원 전용
 * GET  /api/fo/ec/od/order           — 내 주문 목록
 * GET  /api/fo/ec/od/order/page      — 내 주문 페이징
 * GET  /api/fo/ec/od/order/{orderId} — 주문 상세
 * POST /api/fo/ec/od/order           — 주문 생성
 * POST /api/fo/order/create          — 주문 생성 (프론트엔드 경로)
 *
 * 인가: GET → USER or MEMBER / POST → USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/od/order")
@RequiredArgsConstructor
public class FoOdOrderController {

    private final FoOdOrderService foOdOrderService;

    /** myOrders */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDto>>> myOrders(
            @RequestParam Map<String, Object> p) {
        List<OdOrderDto> result = foOdOrderService.getMyOrders(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** myOrderPage */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdOrderDto>>> myOrderPage(
            @RequestParam Map<String, Object> p) {
        PageResult<OdOrderDto> result = foOdOrderService.getMyOrderPage(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OdOrderDto>> getById(@PathVariable("orderId") String orderId) {
        OdOrderDto result = foOdOrderService.getById(orderId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** placeOrder */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrder>> placeOrder(@RequestBody OdOrder entity) {
        OdOrder result = foOdOrderService.placeOrder(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}
