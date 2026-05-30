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
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /** updateSelective — 선택 필드 수정 (MyBatis selective) */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDept>> updateSelective(@PathVariable("id") String id, @RequestBody SyDept entity) {
        entity.setDeptId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyDept>> saveDefault(@RequestBody SyDept entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyDept>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyDept entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyDept> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyDept> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
