package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOrMember;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmBltnService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
public class FoCmBltnController {

    private final FoCmBltnService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBltnDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String blogCateId,
            @RequestParam(required = false) String useYn,
            @RequestParam(required = false) String sort) {
        List<CmBltnDto> result = service.getList(buildParam(siteId, kw, blogCateId, useYn, sort));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBltnDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String blogCateId,
            @RequestParam(required = false) String useYn,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<CmBltnDto> result = service.getPageData(buildParam(siteId, kw, blogCateId, useYn, sort), pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<ApiResponse<CmBltnDto>> getById(@PathVariable String blogId) {
        CmBltnDto result = service.getByIdAndIncrView(blogId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @UserOrMember
    public ResponseEntity<ApiResponse<CmBltn>> create(@RequestBody CmBltn entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{blogId}")
    @UserOrMember
    public ResponseEntity<ApiResponse<CmBltn>> update(
            @PathVariable String blogId, @RequestBody CmBltn entity) {
        CmBltn result = service.update(blogId, entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{blogId}")
    @UserOrMember
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String blogId) {
        service.delete(blogId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    private Map<String, Object> buildParam(String siteId, String kw, String blogCateId, String useYn, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId    != null) p.put("siteId",     siteId);
        if (kw        != null) p.put("kw",          kw);
        if (blogCateId!= null) p.put("blogCateId",  blogCateId);
        if (useYn     != null) p.put("useYn",       useYn);
        if (sort      != null) p.put("sort",         sort);
        return p;
    }
}
