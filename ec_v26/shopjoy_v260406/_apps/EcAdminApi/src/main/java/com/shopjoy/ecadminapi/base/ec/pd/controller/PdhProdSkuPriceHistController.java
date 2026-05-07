package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdSkuPriceHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-sku-price-hist")
@RequiredArgsConstructor
public class PdhProdSkuPriceHistController {

    private final PdhProdSkuPriceHistService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdSkuPriceHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdSkuPriceHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdSkuPriceHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdSkuPriceHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdSkuPriceHistDto>> getById(@PathVariable("id") String id) {
        PdhProdSkuPriceHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
