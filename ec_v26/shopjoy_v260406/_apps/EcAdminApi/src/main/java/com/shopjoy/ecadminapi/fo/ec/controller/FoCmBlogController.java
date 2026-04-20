package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOrMember;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmBlogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 게시물(블로그/FAQ/공지) API
 * GET    /api/fo/ec/cm/bltn           — 목록 (blogCateId, siteId, kw, useYn 필터)
 * GET    /api/fo/ec/cm/bltn/page      — 페이징 목록
 * GET    /api/fo/ec/cm/bltn/{blogId}  — 상세 (조회수 +1)
 * POST   /api/fo/ec/cm/bltn           — 블로그 글 작성 (MEMBER or USER)
 * PUT    /api/fo/ec/cm/bltn/{blogId}  — 수정 (작성자 본인 or USER)
 * DELETE /api/fo/ec/cm/bltn/{blogId}  — 삭제 (작성자 본인 or USER)
 *
 * 인가:
 *   GET    → USER or MEMBER (SecurityConfig 전역 룰)
 *   POST   → @UserOrMember  (전역 룰 override: 회원도 작성 가능)
 *   PUT/DELETE → @UserOrMember (작성자 본인 여부는 서비스에서 검증)
 */
@RestController
@RequestMapping("/api/fo/ec/cm/bltn")
@RequiredArgsConstructor
public class FoCmBlogController {

    private final FoCmBlogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<CmBlogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBlogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<CmBlogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<ApiResponse<CmBlogDto>> getById(@PathVariable String blogId) {
        CmBlogDto result = service.getByIdAndIncrView(blogId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @UserOrMember
    public ResponseEntity<ApiResponse<CmBlog>> create(@RequestBody CmBlog entity) {
        CmBlog result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{blogId}")
    @UserOrMember
    public ResponseEntity<ApiResponse<CmBlog>> update(
            @PathVariable String blogId, @RequestBody CmBlog entity) {
        CmBlog result = service.update(blogId, entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{blogId}")
    @UserOrMember
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String blogId) {
        service.delete(blogId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
