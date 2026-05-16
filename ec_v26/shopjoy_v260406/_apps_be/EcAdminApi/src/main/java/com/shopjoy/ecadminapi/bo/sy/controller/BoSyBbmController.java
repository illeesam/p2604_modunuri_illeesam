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

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBbm> rows) {
        boSyBbmService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
