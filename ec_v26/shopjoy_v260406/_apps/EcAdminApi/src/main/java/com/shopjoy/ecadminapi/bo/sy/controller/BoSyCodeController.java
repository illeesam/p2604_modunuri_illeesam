package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyCodeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 공통코드 API — /api/bo/sy/code
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/code")
@RequiredArgsConstructor
public class BoSyCodeController {
    private final BoSyCodeService boSyCodeService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> list(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeDto.PageResponse>> page(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyCode>> create(@RequestBody SyCode body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyCodeService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> update(@PathVariable("id") String id, @RequestBody SyCode body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> upsert(@PathVariable("id") String id, @RequestBody SyCode body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyCode>>> saveList(@RequestBody List<SyCode> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.saveList(rows), "저장되었습니다."));
    }
}
