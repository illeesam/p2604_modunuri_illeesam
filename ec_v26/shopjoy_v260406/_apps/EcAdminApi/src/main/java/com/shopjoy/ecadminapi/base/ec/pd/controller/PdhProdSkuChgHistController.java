package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdSkuChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-sku-chg-hist")
@RequiredArgsConstructor
public class PdhProdSkuChgHistController {

    private final PdhProdSkuChgHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdSkuChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdSkuChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdSkuChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdSkuChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdSkuChgHistDto>> getById(@PathVariable String id) {
        PdhProdSkuChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
