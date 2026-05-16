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

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyRoleDto.Item>>> list(@Valid @ModelAttribute SyRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyRoleDto.PageResponse>> page(@Valid @ModelAttribute SyRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyRole>> create(@RequestBody SyRole body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyRoleService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRole>> update(@PathVariable("id") String id, @RequestBody SyRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRole>> upsert(@PathVariable("id") String id, @RequestBody SyRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyRoleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyRole> rows) {
        boSyRoleService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
