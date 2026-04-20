package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBltnCateReq;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnCate;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBltnCateService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
public class CmBltnCateController {

    private final CmBltnCateService service;

    /* ── 전체 목록 ── */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBltnCateDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        List<CmBltnCateDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 페이징 목록 ── */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBltnCateDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        PageResult<CmBltnCateDto> result = service.getPageData(p, pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 단건 조회 ── */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBltnCateDto>> getById(@PathVariable String id) {
        CmBltnCateDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBltnCate>> create(@RequestBody CmBltnCate entity) {
        CmBltnCate result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBltnCate>> save(
            @PathVariable String id,
            @RequestBody CmBltnCate entity) {
        entity.setBlogCateId(id);
        CmBltnCate result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id,
            @RequestBody CmBltnCate entity) {
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
    public ResponseEntity<ApiResponse<CmBltnCate>> saveByRowStatus(@RequestBody @Valid CmBltnCateReq req) {
        CmBltnCate result = service.saveByRowStatus(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── _row_status 목록 저장 ── */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<CmBltnCate>>> saveListByRowStatus(@RequestBody @Valid List<CmBltnCateReq> list) {
        List<CmBltnCate> result = service.saveListByRowStatus(list);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildParam(String siteId, String kw,
                                           String dateStart, String dateEnd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId    != null) p.put("siteId",    siteId);
        if (kw        != null) p.put("kw",        kw);
        if (dateStart != null) p.put("dateStart", dateStart);
        if (dateEnd   != null) p.put("dateEnd",   dateEnd);
        if (sort      != null) p.put("sort",      sort);
        return p;
    }
}
