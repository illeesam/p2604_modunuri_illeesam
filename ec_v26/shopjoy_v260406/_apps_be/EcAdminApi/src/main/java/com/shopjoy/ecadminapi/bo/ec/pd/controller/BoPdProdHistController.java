package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdProdHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
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

    /** stock — 페이징(스크롤 조회) */
    @GetMapping("/stock")
    public ResponseEntity<ApiResponse<PageResult<PdProdHistDto.Item>>> stock(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getStockHist(prodId, req)));
    }

    /** price — 페이징(스크롤 조회) */
    @GetMapping("/price")
    public ResponseEntity<ApiResponse<PageResult<PdProdHistDto.Item>>> price(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getPriceHist(prodId, req)));
    }

    /** status — 페이징(스크롤 조회) */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<PageResult<PdProdHistDto.Item>>> status(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getStatusHist(prodId, req)));
    }

    /** changes — 페이징(스크롤 조회) */
    @GetMapping("/changes")
    public ResponseEntity<ApiResponse<PageResult<PdProdHistDto.Item>>> changes(
            @PathVariable("prodId") String prodId,
            @Valid @ModelAttribute PdProdHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdHistService.getChangeHist(prodId, req)));
    }
}
