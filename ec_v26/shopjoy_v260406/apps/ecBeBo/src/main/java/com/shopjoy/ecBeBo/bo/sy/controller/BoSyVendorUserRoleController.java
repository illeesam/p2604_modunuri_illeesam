package com.shopjoy.ecBeBo.bo.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecBeBo.bo.sy.service.BoSyVendorUserRoleService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 업체사용자권한 API — /api/bo/sy/vendor-user-role
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/vendor-user-role")
@RequiredArgsConstructor
public class BoSyVendorUserRoleController {

    private final BoSyVendorUserRoleService boSyVendorUserRoleService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorUserRoleDto.Item>>> list(@Valid @ModelAttribute SyVendorUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyVendorUserRoleDto.Item>>> page(@Valid @ModelAttribute SyVendorUserRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorUserRole>> create(@Valid @RequestBody SyVendorUserRole body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyVendorUserRoleService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> update(@PathVariable("id") String id, @Valid @RequestBody SyVendorUserRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserRole>> upsert(@PathVariable("id") String id, @Valid @RequestBody SyVendorUserRole body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorUserRoleService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyVendorUserRoleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<SyVendorUserRole> rows) {
        switch (cmd) {
            case "base" -> boSyVendorUserRoleService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
