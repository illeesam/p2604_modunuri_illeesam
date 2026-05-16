package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogToggleUseDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmBlogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 게시글(블로그/BBS) API — /api/bo/ec/cm/blog
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/blog")
@RequiredArgsConstructor
public class BoCmBlogController {
    private final BoCmBlogService boCmBlogService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogDto.Item>>> list(@Valid @ModelAttribute CmBlogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogDto.PageResponse>> page(@Valid @ModelAttribute CmBlogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlog>> create(@RequestBody CmBlog body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boCmBlogService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlog>> update(@PathVariable("id") String id, @RequestBody CmBlog body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlog>> upsert(@PathVariable("id") String id, @RequestBody CmBlog body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmBlogService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* toggleUse */
    @PutMapping("/{id}/use")
    public ResponseEntity<ApiResponse<CmBlogDto.Item>> toggleUse(@PathVariable("id") String id, @RequestBody CmBlogToggleUseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.toggleUse(id, req)));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmBlog> rows) {
        boCmBlogService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
