package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdCategoryProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/category-prod")
@RequiredArgsConstructor
public class PdCategoryProdController {

    private final PdCategoryProdService service;

    /* 카테고리-상품 매핑 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryProdDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 카테고리-상품 매핑 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdCategoryProdDto.Item>>> list(@Valid @ModelAttribute PdCategoryProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 카테고리-상품 매핑 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdCategoryProdDto.PageResponse>> page(@Valid @ModelAttribute PdCategoryProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 카테고리-상품 매핑 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdCategoryProd>> create(@RequestBody PdCategoryProd entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 카테고리-상품 매핑 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryProd>> save(@PathVariable("id") String id, @RequestBody PdCategoryProd entity) {
        entity.setCategoryProdId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 카테고리-상품 매핑 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCategoryProd>> updateSelective(@PathVariable("id") String id, @RequestBody PdCategoryProd entity) {
        entity.setCategoryProdId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 카테고리-상품 매핑 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 카테고리-상품 매핑 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdCategoryProd> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
