package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyDeptService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 부서 API — /api/bo/sy/dept
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/dept")
@RequiredArgsConstructor
public class BoSyDeptController {
    private final BoSyDeptService boSyDeptService;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyDeptDto.Item>>> list(@Valid @ModelAttribute SyDeptDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyDeptDto.PageResponse>> page(@Valid @ModelAttribute SyDeptDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.getPageData(req)));
    }

    /** tree — 트리조회 */
    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<SyDeptDto.Item>>> tree() {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.getTree()));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyDept>> create(@RequestBody SyDept body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyDeptService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDept>> update(@PathVariable("id") String id, @RequestBody SyDept body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDept>> upsert(@PathVariable("id") String id, @RequestBody SyDept body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyDeptService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyDept>>> saveList(@RequestBody List<SyDept> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyDeptService.saveList(rows), "저장되었습니다."));
    }
}
