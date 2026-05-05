package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoOdOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * FO 주문 API (프론트엔드 경로 호환)
 * POST /api/fo/order/create  — 주문 생성
 *
 * 인가: MEMBER (로그인 필수)
 */
@RestController
@RequestMapping("/api/fo/order")
@RequiredArgsConstructor
public class FoOrderController {

    private final FoOdOrderService foOdOrderService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(@RequestBody OdOrder entity) {
        OdOrder created = foOdOrderService.placeOrder(entity);
        Map<String, Object> result = new HashMap<>();
        result.put("data", created);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}
