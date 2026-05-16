package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdCategoryService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/category")
@RequiredArgsConstructor
public class PdCategoryController {

    private final PdCategoryService service;

    /* 상품 카테고리 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 카테고리 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdCategoryDto.Item>>> list(@Valid @ModelAttribute PdCategoryDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 카테고리 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdCategoryDto.PageResponse>> page(@Valid @ModelAttribute PdCategoryDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 카테고리 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdCategory>> create(@RequestBody PdCategory entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 카테고리 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategory>> save(@PathVariable("id") String id, @RequestBody PdCategory entity) {
        entity.setCategoryId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 카테고리 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategory>> updateSelective(@PathVariable("id") String id, @RequestBody PdCategory entity) {
        entity.setCategoryId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 카테고리 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 카테고리 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdCategory> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
