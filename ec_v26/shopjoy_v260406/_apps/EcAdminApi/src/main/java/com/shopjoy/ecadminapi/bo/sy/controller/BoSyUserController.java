package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserRoleService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 시스템 사용자 API — /api/bo/sy/user
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/user")
@RequiredArgsConstructor
public class BoSyUserController {
    private final BoSyUserService boSyUserService;
    private final BoSyUserRoleService userRoleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyUserDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<SyUserDto> result = boSyUserService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyUserDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<SyUserDto> result = boSyUserService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserDto>> getById(@PathVariable("id") String id) {
        SyUserDto result = boSyUserService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyUser>> create(@RequestBody SyUser body) {
        SyUser result = boSyUserService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserDto>> update(@PathVariable("id") String id, @RequestBody SyUser body) {
        SyUserDto result = boSyUserService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserDto>> upsert(@PathVariable("id") String id, @RequestBody SyUser body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyUserService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @GetMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<List<SyUserRoleDto>>> getRoles(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userRoleService.getRolesByUserId(userId)));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyUser> rows) {
        boSyUserService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}