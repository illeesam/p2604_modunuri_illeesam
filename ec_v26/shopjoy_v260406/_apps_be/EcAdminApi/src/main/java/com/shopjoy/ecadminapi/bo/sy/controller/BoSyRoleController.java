package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyRoleService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyRole> rows) {
        switch (cmd) {
            case "base" -> boSyRoleService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* 역할별 메뉴 권한 조회 */
    @GetMapping("/{id}/menus")
    public ResponseEntity<ApiResponse<List<SyRoleMenuDto.Item>>> getMenus(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getMenusByRoleId(id)));
    }

    /* 역할별 대상 사용자 조회 */
    @GetMapping("/{id}/users")
    public ResponseEntity<ApiResponse<List<SyUserRoleDto.Item>>> getUsers(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyRoleService.getUsersByRoleId(id)));
    }

    /* 역할별 메뉴 권한 저장 (body: { menus: [{menuId, permLevel}] }) */
    @PostMapping("/{id}/menus")
    public ResponseEntity<ApiResponse<Void>> saveMenus(
            @PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> menus = (List<Map<String, Object>>) body.get("menus");
        boSyRoleService.saveRoleMenus(id, menus);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* 역할별 대상 사용자 저장 (body: { users: [{boUserId}] }) */
    @PostMapping("/{id}/users")
    public ResponseEntity<ApiResponse<Void>> saveUsers(
            @PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> users = (List<Map<String, Object>>) body.get("users");
        boSyRoleService.saveRoleUsers(id, users);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
