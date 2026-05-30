package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyPropService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 시스템속성 API — /api/bo/sy/prop
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/prop")
@RequiredArgsConstructor
public class BoSyPropController {
    private final BoSyPropService boSyPropService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPropDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPropService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPropDto.Item>>> list(@Valid @ModelAttribute SyPropDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPropService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyPropDto.PageResponse>> page(@Valid @ModelAttribute SyPropDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPropService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyProp>> create(@RequestBody SyProp body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyPropService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyProp>> update(@PathVariable("id") String id, @RequestBody SyProp body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPropService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyProp>> upsert(@PathVariable("id") String id, @RequestBody SyProp body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPropService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyPropService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyProp> rows) {
        boSyPropService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
    /** pathCounts — 표시경로 노드별 SyProp 수 (검색조건 + 자손 누적, 트리 우측 뱃지용) */
    @GetMapping("/path-counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> pathCounts(@Valid @ModelAttribute SyPropDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPropService.getPathCounts(req)));
    }

}
