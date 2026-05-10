package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBatchService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 배치 API — /api/bo/sy/batch
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/batch")
@RequiredArgsConstructor
public class BoSyBatchController {
    private final BoSyBatchService boSyBatchService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBatchDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBatchDto.Item>>> list(@Valid @ModelAttribute SyBatchDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBatchDto.PageResponse>> page(@Valid @ModelAttribute SyBatchDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyBatch>> create(@RequestBody SyBatch body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyBatchService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBatch>> update(@PathVariable("id") String id, @RequestBody SyBatch body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBatch>> upsert(@PathVariable("id") String id, @RequestBody SyBatch body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyBatchService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBatch> rows) {
        boSyBatchService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
