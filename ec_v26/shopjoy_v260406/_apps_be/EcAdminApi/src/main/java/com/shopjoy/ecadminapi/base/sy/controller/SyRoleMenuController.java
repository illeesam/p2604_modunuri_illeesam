package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.service.SyRoleMenuService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/role-menu")
@RequiredArgsConstructor
public class SyRoleMenuController {

    private final SyRoleMenuService service;

    /* 역할별 메뉴 권한 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenuDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 역할별 메뉴 권한 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyRoleMenuDto.Item>>> list(@Valid @ModelAttribute SyRoleMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 역할별 메뉴 권한 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyRoleMenuDto.PageResponse>> page(@Valid @ModelAttribute SyRoleMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 역할별 메뉴 권한 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyRoleMenu>> create(@RequestBody SyRoleMenu entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 역할별 메뉴 권한 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenu>> save(@PathVariable("id") String id, @RequestBody SyRoleMenu entity) {
        entity.setRoleMenuId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 역할별 메뉴 권한 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyRoleMenu>> updateSelective(@PathVariable("id") String id, @RequestBody SyRoleMenu entity) {
        entity.setRoleMenuId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 역할별 메뉴 권한 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyRoleMenu>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyRoleMenu entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyRoleMenu> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
