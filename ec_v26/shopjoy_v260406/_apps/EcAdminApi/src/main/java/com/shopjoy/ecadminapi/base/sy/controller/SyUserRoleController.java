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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyUserRoleDto.Item>>> list(@Valid @ModelAttribute SyUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyUserRoleDto.PageResponse>> page(@Valid @ModelAttribute SyUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyUserRole>> create(@RequestBody SyUserRole entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserRole>> save(@PathVariable("id") String id, @RequestBody SyUserRole entity) {
        entity.setUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserRole>> updatePartial(@PathVariable("id") String id, @RequestBody SyUserRole entity) {
        entity.setUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyUserRole>>> saveList(@RequestBody List<SyUserRole> rows) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveList(rows), "저장되었습니다."));
    }
}
