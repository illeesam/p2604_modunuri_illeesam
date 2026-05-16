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

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> list(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeDto.PageResponse>> page(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyCode>> create(@RequestBody SyCode body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyCodeService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> update(@PathVariable("id") String id, @RequestBody SyCode body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> upsert(@PathVariable("id") String id, @RequestBody SyCode body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyCode> rows) {
        boSyCodeService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
