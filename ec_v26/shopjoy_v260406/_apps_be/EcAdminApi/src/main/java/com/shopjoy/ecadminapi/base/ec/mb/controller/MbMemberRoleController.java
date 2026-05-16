package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberRoleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-role")
@RequiredArgsConstructor
public class MbMemberRoleController {

    private final MbMemberRoleService service;

    /* 회원 역할 연결 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberRoleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 회원 역할 연결 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberRoleDto.Item>>> list(@Valid @ModelAttribute MbMemberRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 회원 역할 연결 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberRoleDto.PageResponse>> page(@Valid @ModelAttribute MbMemberRoleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 회원 역할 연결 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberRole>> create(@RequestBody MbMemberRole entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 회원 역할 연결 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberRole>> save(@PathVariable("id") String id, @RequestBody MbMemberRole entity) {
        entity.setMemberRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 회원 역할 연결 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberRole>> updateSelective(@PathVariable("id") String id, @RequestBody MbMemberRole entity) {
        entity.setMemberRoleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 회원 역할 연결 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 회원 역할 연결 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberRole> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
