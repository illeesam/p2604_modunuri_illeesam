package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmBlogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 게시글(블로그/BBS) API
 * GET    /api/bo/ec/cm/blog       — 목록
 * GET    /api/bo/ec/cm/blog/page  — 페이징
 * GET    /api/bo/ec/cm/blog/{id}  — 단건
 * POST   /api/bo/ec/cm/blog       — 등록
 * PUT    /api/bo/ec/cm/blog/{id}  — 수정
 * DELETE /api/bo/ec/cm/blog/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/blog")
@RequiredArgsConstructor
public class BoCmBlogController {
    private final BoCmBlogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<CmBlogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBlogDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<CmBlogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto>> getById(@PathVariable("id") String id) {
        CmBlogDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmBlog>> create(@RequestBody CmBlog body) {
        CmBlog result = service.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto>> update(@PathVariable("id") String id, @RequestBody CmBlog body) {
        CmBlogDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto>> upsert(@PathVariable("id") String id, @RequestBody CmBlog body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PutMapping("/{id}/use")
    public ResponseEntity<ApiResponse<CmBlogDto>> toggleUse(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.toggleUse(id, body)));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmBlog> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}