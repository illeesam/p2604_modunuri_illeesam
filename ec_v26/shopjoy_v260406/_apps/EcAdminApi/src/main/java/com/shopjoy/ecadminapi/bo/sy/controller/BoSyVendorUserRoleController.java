package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorUserRoleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 업체사용자권한 API — /api/bo/sy/vendor-user-role
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/vendor-user-role")
@RequiredArgsConstructor
public class BoSyVendorUserRoleController {

    private final SyVendorUserRoleService syVendorUserRoleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorUserRoleDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syVendorUserRoleService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyVendorUserRoleDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syVendorUserRoleService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRoleDto>> getById(@PathVariable("id") String id) {
        SyVendorUserRoleDto result = syVendorUserRoleService.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorUserRole>> create(@RequestBody SyVendorUserRole body) {
        return ResponseEntity.status(201).body(ApiResponse.created(syVendorUserRoleService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> save(@PathVariable("id") String id, @RequestBody SyVendorUserRole body) {
        body.setVendorUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(syVendorUserRoleService.save(body)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(@PathVariable("id") String id, @RequestBody SyVendorUserRole body) {
        body.setVendorUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(syVendorUserRoleService.update(body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        syVendorUserRoleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVendorUserRole> rows) {
        syVendorUserRoleService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
