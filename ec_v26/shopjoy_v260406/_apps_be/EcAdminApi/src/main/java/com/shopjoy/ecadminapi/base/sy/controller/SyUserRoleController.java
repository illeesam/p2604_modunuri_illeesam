package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyUserRoleService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyUserRole>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyUserRole entity) {
        SyUserRole result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyUserRole> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
