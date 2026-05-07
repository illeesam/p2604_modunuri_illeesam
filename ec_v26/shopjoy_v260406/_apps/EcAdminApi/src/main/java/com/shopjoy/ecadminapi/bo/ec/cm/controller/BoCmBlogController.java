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
    private final BoCmBlogService boCmBlogService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<CmBlogDto> result = boCmBlogService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBlogDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<CmBlogDto> result = boCmBlogService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto>> getById(@PathVariable("id") String id) {
        CmBlogDto result = boCmBlogService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlog>> create(@RequestBody CmBlog body) {
        CmBlog result = boCmBlogService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto>> update(@PathVariable("id") String id, @RequestBody CmBlog body) {
        CmBlogDto result = boCmBlogService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto>> upsert(@PathVariable("id") String id, @RequestBody CmBlog body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmBlogService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** toggleUse — 전환 */
    @PutMapping("/{id}/use")
    public ResponseEntity<ApiResponse<CmBlogDto>> toggleUse(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogService.toggleUse(id, body)));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmBlog> rows) {
        boCmBlogService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}