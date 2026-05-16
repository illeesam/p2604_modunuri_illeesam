package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 업체 API — /api/bo/sy/vendor
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/vendor")
@RequiredArgsConstructor
public class BoSyVendorController {
    private final BoSyVendorService boSyVendorService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorDto.Item>>> list(@Valid @ModelAttribute SyVendorDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorDto.PageResponse>> page(@Valid @ModelAttribute SyVendorDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVendor>> create(@RequestBody SyVendor body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyVendorService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendor>> update(@PathVariable("id") String id, @RequestBody SyVendor body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendor>> upsert(@PathVariable("id") String id, @RequestBody SyVendor body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyVendorService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVendor> rows) {
        boSyVendorService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
