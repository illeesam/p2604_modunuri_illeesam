package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogGoodService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-good")
@RequiredArgsConstructor
public class CmBlogGoodController {

    private final CmBlogGoodService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogGoodDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<CmBlogGoodDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBlogGoodDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<CmBlogGoodDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogGoodDto>> getById(@PathVariable String id) {
        CmBlogGoodDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogGood>> create(@RequestBody CmBlogGood entity) {
        CmBlogGood result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogGood>> save(
            @PathVariable String id, @RequestBody CmBlogGood entity) {
        entity.setLikeId(id);
        CmBlogGood result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody CmBlogGood entity) {
        entity.setLikeId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

}
