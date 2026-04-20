package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBlogFileReq;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogFileService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-file")
@RequiredArgsConstructor
public class CmBlogFileController {

    private final CmBlogFileService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogFileDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<CmBlogFileDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBlogFileDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<CmBlogFileDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogFileDto>> getById(@PathVariable String id) {
        CmBlogFileDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogFile>> create(@RequestBody CmBlogFile entity) {
        CmBlogFile result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogFile>> save(
            @PathVariable String id, @RequestBody CmBlogFile entity) {
        entity.setBlogImgId(id);
        CmBlogFile result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody CmBlogFile entity) {
        entity.setBlogImgId(id);
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
    public ResponseEntity<ApiResponse<CmBlogFile>> saveByRowStatus(@RequestBody @Valid CmBlogFileReq req) {
        CmBlogFile result = service.saveByRowStatus(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── _row_status 목록 저장 ── */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<CmBlogFile>>> saveListByRowStatus(@RequestBody @Valid List<CmBlogFileReq> list) {
        List<CmBlogFile> result = service.saveListByRowStatus(list);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

}
