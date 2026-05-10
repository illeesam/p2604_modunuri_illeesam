package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdSaveDto;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdCategoryProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO 카테고리-상품 매핑 API
 * GET /api/bo/ec/pd/category-prod/page  — 페이징 조회 (categoryId 필터)
 * PUT /api/bo/ec/pd/category-prod       — 일괄 저장
 */
@RestController
@RequestMapping("/api/bo/ec/pd/category-prod")
@RequiredArgsConstructor
public class BoPdCategoryProdController {

    private final BoPdCategoryProdService boPdCategoryProdService;

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdCategoryProdDto.PageResponse>> page(@Valid @ModelAttribute PdCategoryProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdCategoryProdService.getPageData(req)));
    }

    /** saveProds — 저장 */
    @PutMapping
    public ResponseEntity<ApiResponse<Void>> saveProds(@RequestBody PdCategoryProdSaveDto.Request req) {
        boPdCategoryProdService.saveProds(req);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
