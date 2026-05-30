package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbmService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO BBM API — /api/bo/sy/bbm
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/bbm")
@RequiredArgsConstructor
public class BoSyBbmController {
    private final BoSyBbmService boSyBbmService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbmDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbmService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBbmDto.Item>>> list(@Valid @ModelAttribute SyBbmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbmService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBbmDto.PageResponse>> page(@Valid @ModelAttribute SyBbmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbmService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyBbm>> create(@RequestBody SyBbm body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyBbmService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbm>> update(@PathVariable("id") String id, @RequestBody SyBbm body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbmService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbm>> upsert(@PathVariable("id") String id, @RequestBody SyBbm body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbmService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyBbmService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyBbm> rows) {
        boSyBbmService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
    /** pathCounts — 표시경로 노드별 SyBbm 수 (자손 누적, 트리 우측 뱃지용) */
    @GetMapping("/path-counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> pathCounts(@Valid @ModelAttribute SyBbmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbmService.getPathTreeNodeCounts(req)));
    }

}
