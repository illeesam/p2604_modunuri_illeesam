package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorUserService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/vendor-user")
@RequiredArgsConstructor
public class SyVendorUserController {

    private final SyVendorUserService service;

    /* 업체 사용자 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUserDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 업체 사용자 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorUserDto.Item>>> list(@Valid @ModelAttribute SyVendorUserDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 업체 사용자 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorUserDto.PageResponse>> page(@Valid @ModelAttribute SyVendorUserDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 업체 사용자 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorUser>> create(@RequestBody SyVendorUser entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 업체 사용자 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUser>> save(@PathVariable("id") String id, @RequestBody SyVendorUser entity) {
        entity.setVendorUserId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 업체 사용자 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorUser>> updateSelective(@PathVariable("id") String id, @RequestBody SyVendorUser entity) {
        entity.setVendorUserId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 업체 사용자 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 업체 사용자 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVendorUser> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
