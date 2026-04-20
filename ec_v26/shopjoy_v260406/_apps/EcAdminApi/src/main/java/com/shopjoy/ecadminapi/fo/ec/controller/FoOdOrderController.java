package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.fo.ec.service.FoOdOrderService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FO 주문 API — 현재 로그인 회원 전용
 * GET  /api/fo/ec/od/order           — 내 주문 목록
 * GET  /api/fo/ec/od/order/page      — 내 주문 페이징
 * GET  /api/fo/ec/od/order/{orderId} — 주문 상세
 * POST /api/fo/ec/od/order           — 주문 생성
 *
 * 인가: GET → USER or MEMBER / POST → USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/od/order")
@RequiredArgsConstructor
public class FoOdOrderController {

    private final FoOdOrderService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDto>>> myOrders(
            @RequestParam(required = false) String siteId) {
        List<OdOrderDto> result = service.getMyOrders(siteId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdOrderDto>>> myOrderPage(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<OdOrderDto> result = service.getMyOrderPage(siteId, pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OdOrderDto>> getById(@PathVariable String orderId) {
        OdOrderDto result = service.getById(orderId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdOrder>> placeOrder(@RequestBody OdOrder entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.placeOrder(entity)));
    }
}
