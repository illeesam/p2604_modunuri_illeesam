package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdSkuStockHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-sku-stock-hist")
@RequiredArgsConstructor
public class PdhProdSkuStockHistController {

    private final PdhProdSkuStockHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdSkuStockHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdSkuStockHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdSkuStockHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdSkuStockHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdSkuStockHistDto>> getById(@PathVariable("id") String id) {
        PdhProdSkuStockHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
