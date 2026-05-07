package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAttachService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 첨부파일 API — /api/bo/sy/attach
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/attach")
@RequiredArgsConstructor
public class BoSyAttachController {
    private final BoSyAttachService boSyAttachService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAttachDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<SyAttachDto> result = boSyAttachService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyAttachDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<SyAttachDto> result = boSyAttachService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachDto>> getById(@PathVariable("id") String id) {
        SyAttachDto result = boSyAttachService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyAttach>> create(@RequestBody SyAttach body) {
        SyAttach result = boSyAttachService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachDto>> update(@PathVariable("id") String id, @RequestBody SyAttach body) {
        SyAttachDto result = boSyAttachService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachDto>> upsert(@PathVariable("id") String id, @RequestBody SyAttach body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyAttachService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyAttach> rows) {
        boSyAttachService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}