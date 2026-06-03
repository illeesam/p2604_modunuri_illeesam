package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorUserRoleService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/vendor-user-role")
@RequiredArgsConstructor
public class SyVendorUserRoleController {

    private final SyVendorUserRoleService service;

    /* 업체 사용자 역할 연결 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 업체 사용자 역할 연결 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorUserRoleDto.Item>>> list(@Valid @ModelAttribute SyVendorUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 업체 사용자 역할 연결 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorUserRoleDto.PageResponse>> page(@Valid @ModelAttribute SyVendorUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 업체 사용자 역할 연결 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorUserRole>> create(@RequestBody SyVendorUserRole entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 업체 사용자 역할 연결 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> save(@PathVariable("id") String id, @RequestBody SyVendorUserRole entity) {
        entity.setVendorUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 업체 사용자 역할 연결 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> updateSelective(@PathVariable("id") String id, @RequestBody SyVendorUserRole entity) {
        entity.setVendorUserRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 업체 사용자 역할 연결 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyVendorUserRole entity) {
        SyVendorUserRole result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyVendorUserRole> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
