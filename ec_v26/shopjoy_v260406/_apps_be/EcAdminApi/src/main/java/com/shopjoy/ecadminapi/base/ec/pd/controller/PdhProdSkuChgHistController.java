package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdSkuChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SKU 변경 이력 — write-once 로그성 (조회 + 등록만 지원).
 */
@RestController
@RequestMapping("/api/base/ec/pd/prod-sku-chg-hist")
@RequiredArgsConstructor
public class PdhProdSkuChgHistController {

    private final PdhProdSkuChgHistService service;

    /* 상품 SKU 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdSkuChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 SKU 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdSkuChgHistDto.Item>>> list(@Valid @ModelAttribute PdhProdSkuChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 SKU 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdSkuChgHistDto.PageResponse>> page(@Valid @ModelAttribute PdhProdSkuChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 SKU 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdSkuChgHist>> create(@RequestBody PdhProdSkuChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }
}
