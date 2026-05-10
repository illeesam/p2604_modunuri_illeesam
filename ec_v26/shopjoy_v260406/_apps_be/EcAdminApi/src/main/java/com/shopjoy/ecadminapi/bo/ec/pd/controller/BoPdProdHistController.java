package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdProdHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 상품 이력 API
 * GET /api/bo/ec/pd/prod/{prodId}/hist/orders   — 연관 주문
 * GET /api/bo/ec/pd/prod/{prodId}/hist/stock    — 재고 이력
 * GET /api/bo/ec/pd/prod/{prodId}/hist/price    — 가격 이력
 * GET /api/bo/ec/pd/prod/{prodId}/hist/status   — 상태 이력
 * GET /api/bo/ec/pd/prod/{prodId}/hist/changes  — 변경 이력
 */
@RestController
@RequestMapping("/api/bo/ec/pd/prod/{prodId}/hist")
@RequiredArgsConstructor
public class BoPdProdHistController {

    private final BoPdProdHistService boPdProdHistService;

    /** orders */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<PdProdHistDto.Item>>> orders(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getOrders(prodId, req)));
    }

    /** stock */
    @GetMapping("/stock")
    public ResponseEntity<ApiResponse<List<PdProdHistDto.Item>>> stock(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getStockHist(prodId, req)));
    }

    /** price */
    @GetMapping("/price")
    public ResponseEntity<ApiResponse<List<PdProdHistDto.Item>>> price(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getPriceHist(prodId, req)));
    }

    /** status */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<List<PdProdHistDto.Item>>> status(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getStatusHist(prodId, req)));
    }

    /** changes */
    @GetMapping("/changes")
    public ResponseEntity<ApiResponse<List<PdProdHistDto.Item>>> changes(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getChangeHist(prodId, req)));
    }
}
