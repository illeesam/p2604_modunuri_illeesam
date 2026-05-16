package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyPathService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 표시경로 API — /api/bo/sy/path
 */
@RestController
@RequestMapping("/api/bo/sy/path")
@RequiredArgsConstructor
public class BoSyPathController {

    private final BoSyPathService boSyPathService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPathDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPathDto.Item>>> list(@Valid @ModelAttribute SyPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyPathDto.PageResponse>> page(@Valid @ModelAttribute SyPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyPath>> create(@RequestBody SyPath entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyPathService.create(entity)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPath>> update(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.update(id, entity)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPath>> upsert(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.update(id, entity)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyPathService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyPath> rows) {
        boSyPathService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
