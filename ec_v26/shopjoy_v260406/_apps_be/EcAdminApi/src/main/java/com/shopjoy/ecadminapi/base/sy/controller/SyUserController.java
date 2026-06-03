package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.service.SyUserService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        SyUser result = service.saveOneBase(entity);
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyUser>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyUser entity) {
        SyUser result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyUser> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
