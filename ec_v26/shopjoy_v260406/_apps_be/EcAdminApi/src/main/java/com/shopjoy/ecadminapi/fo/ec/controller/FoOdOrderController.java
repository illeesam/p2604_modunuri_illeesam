package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoOdOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FO 주문 API — 현재 로그인 회원 전용
 */
@RestController
@RequestMapping("/api/fo/ec/od/order")
@RequiredArgsConstructor
public class FoOdOrderController {

    private final FoOdOrderService foOdOrderService;

    /* myOrders */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDto.Item>>> myOrders(@Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foOdOrderService.getMyOrders(req)));
    }

    /* myOrderPage */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderDto.PageResponse>> myOrderPage(@Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foOdOrderService.getMyOrderPage(req)));
    }

    /* 키조회 */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OdOrderDto.Item>> getById(@PathVariable("orderId") String orderId) {
        return ResponseEntity.ok(ApiResponse.ok(foOdOrderService.getById(orderId)));
    }

    /* placeOrder */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrder>> placeOrder(@RequestBody OdOrder entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(foOdOrderService.placeOrder(entity)));
    }
}
