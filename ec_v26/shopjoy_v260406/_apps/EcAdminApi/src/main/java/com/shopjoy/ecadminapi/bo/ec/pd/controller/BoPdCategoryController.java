package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdCategoryService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 카테고리 API
 * GET    /api/bo/ec/pd/category       — 목록
 * GET    /api/bo/ec/pd/category/page  — 페이징
 * GET    /api/bo/ec/pd/category/{id}  — 단건
 * POST   /api/bo/ec/pd/category       — 등록
 * PUT    /api/bo/ec/pd/category/{id}  — 수정
 * DELETE /api/bo/ec/pd/category/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/category")
@RequiredArgsConstructor
public class BoPdCategoryController {
    private final BoPdCategoryService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdCategoryDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PdCategoryDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdCategoryDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PdCategoryDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto>> getById(@PathVariable String id) {
        PdCategoryDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdCategory>> create(@RequestBody PdCategory body) {
        PdCategory result = service.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto>> update(@PathVariable String id, @RequestBody PdCategory body) {
        PdCategoryDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto>> upsert(@PathVariable String id, @RequestBody PdCategory body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PutMapping("/{id}/prods/{activeTypeCd}")
    public ResponseEntity<ApiResponse<Void>> updateProds(
            @PathVariable String id,
            @PathVariable String activeTypeCd,
            @RequestBody Map<String, Object> body) {
        service.updateProds(id, activeTypeCd, body);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdCategory> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}