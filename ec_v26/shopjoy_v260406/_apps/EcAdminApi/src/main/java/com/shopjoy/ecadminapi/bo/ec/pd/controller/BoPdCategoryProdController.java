package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdCategoryProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * BO 카테고리-상품 매핑 API
 * GET /api/bo/ec/pd/category-prod/page  — 페이징 조회 (categoryId 필터)
 * PUT /api/bo/ec/pd/category-prod       — 일괄 저장
 */
@RestController
@RequestMapping("/api/bo/ec/pd/category-prod")
@RequiredArgsConstructor
public class BoPdCategoryProdController {

    private final BoPdCategoryProdService service;

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdCategoryProdDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdCategoryProdDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> saveProds(@RequestBody Map<String, Object> body) {
        service.saveProds(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
