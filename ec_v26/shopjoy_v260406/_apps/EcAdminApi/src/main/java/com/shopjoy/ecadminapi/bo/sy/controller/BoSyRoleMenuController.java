package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyRoleMenuService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 역할-메뉴 API — /api/bo/sy/role-menu
 */
@RestController
@RequestMapping("/api/bo/sy/role-menu")
@RequiredArgsConstructor
public class BoSyRoleMenuController {

    private final BoSyRoleMenuService boSyRoleMenuService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyRoleMenuDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyRoleMenuDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.getPageData(p)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenuDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyRoleMenu>> create(@RequestBody SyRoleMenu body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyRoleMenuService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenuDto>> update(@PathVariable("id") String id, @RequestBody SyRoleMenu body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleMenuService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyRoleMenuService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyRoleMenu> rows) {
        boSyRoleMenuService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}