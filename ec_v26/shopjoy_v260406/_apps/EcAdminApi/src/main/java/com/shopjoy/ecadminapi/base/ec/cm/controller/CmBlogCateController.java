package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBlogCateReq;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogCateService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 게시판 카테고리 API
 * GET    /api/base/ec/cm/bltn-cate           — 전체 목록
 * GET    /api/base/ec/cm/bltn-cate/page      — 페이징 목록
 * GET    /api/base/ec/cm/bltn-cate/{id}      — 단건 조회
 * POST   /api/base/ec/cm/bltn-cate           — 등록 (JPA)
 * PUT    /api/base/ec/cm/bltn-cate/{id}      — 전체 수정 (JPA)
 * PATCH  /api/base/ec/cm/bltn-cate/{id}      — 선택 필드 수정 (MyBatis)
 * DELETE /api/base/ec/cm/bltn-cate/{id}      — 삭제 (JPA)
 * POST   /api/base/ec/cm/bltn-cate/save      — _row_status 단건 저장 (I/U/D)
 * POST   /api/base/ec/cm/bltn-cate/save-list — _row_status 목록 저장 (I/U/D)
 */
@RestController
@RequestMapping("/api/base/ec/cm/bltn-cate")
@RequiredArgsConstructor
public class CmBlogCateController {

    private final CmBlogCateService service;

    /* ── 전체 목록 ── */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogCateDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<CmBlogCateDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 페이징 목록 ── */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBlogCateDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<CmBlogCateDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 단건 조회 ── */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogCateDto>> getById(@PathVariable String id) {
        CmBlogCateDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogCate>> create(@RequestBody CmBlogCate entity) {
        CmBlogCate result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogCate>> save(
            @PathVariable String id,
            @RequestBody CmBlogCate entity) {
        entity.setBlogCateId(id);
        CmBlogCate result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id,
            @RequestBody CmBlogCate entity) {
        entity.setBlogCateId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ── _row_status 단건 저장 ── */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<CmBlogCate>> saveByRowStatus(@RequestBody @Valid CmBlogCateReq req) {
        CmBlogCate result = service.saveByRowStatus(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── _row_status 목록 저장 ── */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<CmBlogCate>>> saveListByRowStatus(@RequestBody @Valid List<CmBlogCateReq> list) {
        List<CmBlogCate> result = service.saveListByRowStatus(list);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

}
