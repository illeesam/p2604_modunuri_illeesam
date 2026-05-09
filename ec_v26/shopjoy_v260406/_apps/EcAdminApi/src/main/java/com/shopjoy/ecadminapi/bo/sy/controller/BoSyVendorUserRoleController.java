package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorUserRoleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 업체사용자권한 API — /api/bo/sy/vendor-user-role
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/vendor-user-role")
@RequiredArgsConstructor
public class BoSyVendorUserRoleController {

    private final BoSyVendorUserRoleService boSyVendorUserRoleService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorUserRoleDto.Item>>> list(@Valid @ModelAttribute SyVendorUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorUserRoleDto.PageResponse>> page(@Valid @ModelAttribute SyVendorUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorUserRole>> create(@RequestBody SyVendorUserRole body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyVendorUserRoleService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> update(@PathVariable("id") String id, @RequestBody SyVendorUserRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> upsert(@PathVariable("id") String id, @RequestBody SyVendorUserRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyVendorUserRoleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyVendorUserRole>>> saveList(@RequestBody List<SyVendorUserRole> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.saveList(rows), "저장되었습니다."));
    }
}
