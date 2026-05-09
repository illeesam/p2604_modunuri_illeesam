package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAttachService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 첨부파일 API — /api/bo/sy/attach
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/attach")
@RequiredArgsConstructor
public class BoSyAttachController {
    private final BoSyAttachService boSyAttachService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAttachDto.Item>>> list(@Valid @ModelAttribute SyAttachDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAttachDto.PageResponse>> page(@Valid @ModelAttribute SyAttachDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyAttach>> create(@RequestBody SyAttach body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyAttachService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttach>> update(@PathVariable("id") String id, @RequestBody SyAttach body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttach>> upsert(@PathVariable("id") String id, @RequestBody SyAttach body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyAttachService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyAttach> rows) {
        boSyAttachService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
