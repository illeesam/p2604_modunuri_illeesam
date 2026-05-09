package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryUpdateProdsDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdCategoryService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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
    private final BoPdCategoryService boPdCategoryService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdCategoryDto.Item>>> list(@Valid @ModelAttribute PdCategoryDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdCategoryService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdCategoryDto.PageResponse>> page(@Valid @ModelAttribute PdCategoryDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdCategoryService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto.Item>> getById(@PathVariable("id") String id) {
        PdCategoryDto.Item result = boPdCategoryService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdCategory>> create(@RequestBody PdCategory body) {
        PdCategory result = boPdCategoryService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategory>> update(@PathVariable("id") String id, @RequestBody PdCategory body) {
        PdCategory result = boPdCategoryService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategory>> upsert(@PathVariable("id") String id, @RequestBody PdCategory body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdCategoryService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdCategoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** updateProds — 수정 */
    @PutMapping("/{id}/prods/{activeTypeCd}")
    public ResponseEntity<ApiResponse<Void>> updateProds(
            @PathVariable("id") String id,
            @PathVariable("activeTypeCd") String activeTypeCd,
            @RequestBody PdCategoryUpdateProdsDto.Request req) {
        boPdCategoryService.updateProds(id, activeTypeCd, req);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdCategory> rows) {
        boPdCategoryService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}