package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorUserService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 업체사용자 API — /api/bo/sy/vendor-user
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/vendor-user")
@RequiredArgsConstructor
public class BoSyVendorUserController {

    private final BoSyVendorUserService boSyVendorUserService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorUserDto.Item>>> list(@Valid @ModelAttribute SyVendorUserDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorUserDto.PageResponse>> page(@Valid @ModelAttribute SyVendorUserDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorUser>> create(@RequestBody SyVendorUser body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyVendorUserService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUser>> update(@PathVariable("id") String id, @RequestBody SyVendorUser body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUser>> upsert(@PathVariable("id") String id, @RequestBody SyVendorUser body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyVendorUserService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyVendorUser>>> saveList(@RequestBody List<SyVendorUser> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserService.saveList(rows), "저장되었습니다."));
    }
}
