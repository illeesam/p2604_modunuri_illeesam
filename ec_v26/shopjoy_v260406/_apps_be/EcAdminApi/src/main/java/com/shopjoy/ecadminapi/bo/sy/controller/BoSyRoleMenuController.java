package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyRoleMenuService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 역할-메뉴 API — /api/bo/sy/role-menu
 */
@RestController
@RequestMapping("/api/bo/sy/role-menu")
@RequiredArgsConstructor
public class BoSyRoleMenuController {

    private final BoSyRoleMenuService boSyRoleMenuService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenuDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyRoleMenuDto.Item>>> list(@Valid @ModelAttribute SyRoleMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyRoleMenuDto.PageResponse>> page(@Valid @ModelAttribute SyRoleMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyRoleMenu>> create(@RequestBody SyRoleMenu body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyRoleMenuService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenu>> update(@PathVariable("id") String id, @RequestBody SyRoleMenu body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenu>> upsert(@PathVariable("id") String id, @RequestBody SyRoleMenu body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyRoleMenuService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyRoleMenu> rows) {
        boSyRoleMenuService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
