package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdCategoryService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 카테고리 API
 * GET    /api/bo/ec/pd/category       — 목록
 * GET    /api/bo/ec/pd/category/page  — 페이징
 * GET    /api/bo/ec/pd/category/{id}  — 단건
 * POST   /api/bo/ec/pd/category       — 등록
 * PUT    /api/bo/ec/pd/category/{id}  — 수정
 * DELETE /api/bo/ec/pd/category/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/category")
@RequiredArgsConstructor
@UserOnly
public class BoPdCategoryController {
    private final BoPdCategoryService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdCategoryDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdCategoryDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdCategory>> create(@RequestBody PdCategory body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto>> update(@PathVariable String id, @RequestBody PdCategory body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
