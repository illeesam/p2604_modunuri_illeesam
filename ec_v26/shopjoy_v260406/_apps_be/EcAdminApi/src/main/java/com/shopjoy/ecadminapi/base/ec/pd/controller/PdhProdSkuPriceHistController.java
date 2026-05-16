package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdSkuPriceHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SKU 가격 이력 — write-once 로그성 (조회 + 등록만 지원).
 */
@RestController
@RequestMapping("/api/base/ec/pd/prod-sku-price-hist")
@RequiredArgsConstructor
public class PdhProdSkuPriceHistController {

    private final PdhProdSkuPriceHistService service;

    /* 상품 SKU 가격 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdSkuPriceHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 SKU 가격 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdSkuPriceHistDto.Item>>> list(@Valid @ModelAttribute PdhProdSkuPriceHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 SKU 가격 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdSkuPriceHistDto.PageResponse>> page(@Valid @ModelAttribute PdhProdSkuPriceHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 SKU 가격 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdSkuPriceHist>> create(@RequestBody PdhProdSkuPriceHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }
}
