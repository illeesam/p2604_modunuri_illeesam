package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdSkuStockHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SKU 재고 이력 — write-once 로그성 (조회 + 등록만 지원).
 */
@RestController
@RequestMapping("/api/base/ec/pd/prod-sku-stock-hist")
@RequiredArgsConstructor
public class PdhProdSkuStockHistController {

    private final PdhProdSkuStockHistService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdSkuStockHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdSkuStockHistDto.Item>>> list(@Valid @ModelAttribute PdhProdSkuStockHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdSkuStockHistDto.PageResponse>> page(@Valid @ModelAttribute PdhProdSkuStockHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdSkuStockHist>> create(@RequestBody PdhProdSkuStockHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }
}
