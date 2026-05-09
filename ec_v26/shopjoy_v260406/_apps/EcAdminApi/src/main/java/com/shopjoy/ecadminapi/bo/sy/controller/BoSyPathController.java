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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPathDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPathDto.Item>>> list(@Valid @ModelAttribute SyPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyPathDto.PageResponse>> page(@Valid @ModelAttribute SyPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyPath>> create(@RequestBody SyPath entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyPathService.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPath>> update(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.update(id, entity)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPath>> upsert(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(boSyPathService.update(id, entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyPathService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyPath> rows) {
        boSyPathService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
