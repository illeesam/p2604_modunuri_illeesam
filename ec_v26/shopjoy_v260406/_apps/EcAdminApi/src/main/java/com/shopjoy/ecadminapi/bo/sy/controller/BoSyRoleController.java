package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyRoleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 역할(권한) API — /api/bo/sy/role
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/role")
@RequiredArgsConstructor
public class BoSyRoleController {
    private final BoSyRoleService boSyRoleService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyRoleDto.Item>>> list(@Valid @ModelAttribute SyRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyRoleDto.PageResponse>> page(@Valid @ModelAttribute SyRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyRole>> create(@RequestBody SyRole body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyRoleService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRole>> update(@PathVariable("id") String id, @RequestBody SyRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRole>> upsert(@PathVariable("id") String id, @RequestBody SyRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyRoleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyRole>>> saveList(@RequestBody List<SyRole> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.saveList(rows), "저장되었습니다."));
    }
}
