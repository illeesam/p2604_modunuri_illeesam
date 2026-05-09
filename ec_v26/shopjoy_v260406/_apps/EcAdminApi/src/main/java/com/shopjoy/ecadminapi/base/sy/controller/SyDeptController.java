package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.service.SyDeptService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/dept")
@RequiredArgsConstructor
public class SyDeptController {

    private final SyDeptService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyDeptDto.Item>>> list(@Valid @ModelAttribute SyDeptDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyDeptDto.PageResponse>> page(@Valid @ModelAttribute SyDeptDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getTree — 트리조회 */
    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<SyDeptDto.Item>>> getTree() {
        return ResponseEntity.ok(ApiResponse.ok(service.getTree()));
    }

    /** create — 생성 (JPA) */
    @PostMapping
    public ResponseEntity<ApiResponse<SyDept>> create(@RequestBody SyDept entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** save — 전체 수정 (JPA) */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDept>> save(@PathVariable("id") String id, @RequestBody SyDept entity) {
        entity.setDeptId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /** updatePartial — 선택 필드 수정 (MyBatis selective) */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDept>> updatePartial(@PathVariable("id") String id, @RequestBody SyDept entity) {
        entity.setDeptId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyDept>>> saveList(@RequestBody List<SyDept> rows) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveList(rows), "저장되었습니다."));
    }
}
