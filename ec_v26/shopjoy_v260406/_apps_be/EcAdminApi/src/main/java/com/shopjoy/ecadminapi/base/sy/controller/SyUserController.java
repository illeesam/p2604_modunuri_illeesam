package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.service.SyUserService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/user")
@RequiredArgsConstructor
public class SyUserController {

    private final SyUserService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUserDto.Item>> getById(@PathVariable("id") String id) {
        SyUserDto.Item result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyUserDto.Item>>> list(
            @Valid @ModelAttribute SyUserDto.Request req) {
        List<SyUserDto.Item> result = service.getList(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyUserDto.PageResponse>> page(
            @Valid @ModelAttribute SyUserDto.Request req) {
        SyUserDto.PageResponse result = service.getPageData(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<SyUser>> create(@RequestBody SyUser entity) {
        SyUser result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUser>> save(
            @PathVariable("id") String id, @RequestBody SyUser entity) {
        entity.setUserId(id);
        SyUser result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis selective) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyUser>> updateSelective(
            @PathVariable("id") String id, @RequestBody SyUser entity) {
        entity.setUserId(id);
        SyUser result = service.updateSelective(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyUser> rows) {
        service.saveList(rows);

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
