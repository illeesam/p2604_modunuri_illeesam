package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyUserRoleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/user-role")
@RequiredArgsConstructor
public class SyUserRoleController {

    private final SyUserRoleService service;

    /* 사용자별 역할 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 사용자별 역할 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyUserRoleDto.Item>>> list(@Valid @ModelAttribute SyUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 사용자별 역할 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyUserRoleDto.PageResponse>> page(@Valid @ModelAttribute SyUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 사용자별 역할 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyUserRole>> create(@RequestBody SyUserRole entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 사용자별 역할 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserRole>> save(@PathVariable("id") String id, @RequestBody SyUserRole entity) {
        entity.setUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 사용자별 역할 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserRole>> updateSelective(@PathVariable("id") String id, @RequestBody SyUserRole entity) {
        entity.setUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 사용자별 역할 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 사용자별 역할 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyUserRole> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
