package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberRoleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/mb/member-role")
@RequiredArgsConstructor
public class MbMemberRoleController {

    private final MbMemberRoleService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberRoleDto>>> list(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberRoleDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberRoleDto>> getById(@PathVariable String id) {
        MbMemberRoleDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberRole>> create(@RequestBody MbMemberRole entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberRole>> save(
            @PathVariable String id, @RequestBody MbMemberRole entity) {
        entity.setMemberRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody MbMemberRole entity) {
        entity.setMemberRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.update(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
