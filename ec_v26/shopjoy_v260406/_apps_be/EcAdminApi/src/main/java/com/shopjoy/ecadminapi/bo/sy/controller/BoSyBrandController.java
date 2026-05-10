package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBrandService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 브랜드 API — /api/bo/sy/brand
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/brand")
@RequiredArgsConstructor
public class BoSyBrandController {
    private final BoSyBrandService boSyBrandService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBrandDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBrandService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBrandDto.Item>>> list(@Valid @ModelAttribute SyBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBrandService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBrandDto.PageResponse>> page(@Valid @ModelAttribute SyBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBrandService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyBrand>> create(@RequestBody SyBrand body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyBrandService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBrand>> update(@PathVariable("id") String id, @RequestBody SyBrand body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBrandService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBrand>> upsert(@PathVariable("id") String id, @RequestBody SyBrand body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBrandService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyBrandService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBrand> rows) {
        boSyBrandService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
