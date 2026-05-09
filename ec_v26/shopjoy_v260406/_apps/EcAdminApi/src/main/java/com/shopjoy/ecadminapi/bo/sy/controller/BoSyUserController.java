package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserRoleService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserDto.Item>> getById(@PathVariable("id") String id) {
        SyUserDto.Item result = boSyUserService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyUserDto.Item>>> list(
            @Valid @ModelAttribute SyUserDto.Request req) {
        List<SyUserDto.Item> result = boSyUserService.getList(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyUserDto.PageResponse>> page(
            @Valid @ModelAttribute SyUserDto.Request req) {
        SyUserDto.PageResponse result = boSyUserService.getPageData(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyUser>> create(@RequestBody SyUser body) {
        SyUser result = boSyUserService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUser>> update(@PathVariable("id") String id, @RequestBody SyUser body) {
        SyUser result = boSyUserService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUser>> upsert(@PathVariable("id") String id, @RequestBody SyUser body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyUserService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** getRoles — 조회 */
    @GetMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<List<SyUserRoleDto.Item>>> getRoles(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userRoleService.getRolesByUserId(userId)));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyUser>>> saveList(@RequestBody List<SyUser> rows) {
        List<SyUser> result = boSyUserService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }
}
