package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.service.SyBatchService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/batch")
@RequiredArgsConstructor
public class SyBatchController {

    private final SyBatchService service;

    /* 배치 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBatchDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배치 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBatchDto.Item>>> list(@Valid @ModelAttribute SyBatchDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배치 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBatchDto.PageResponse>> page(@Valid @ModelAttribute SyBatchDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배치 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyBatch>> create(@RequestBody SyBatch entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배치 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBatch>> save(@PathVariable("id") String id, @RequestBody SyBatch entity) {
        entity.setBatchId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 배치 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBatch>> updateSelective(@PathVariable("id") String id, @RequestBody SyBatch entity) {
        entity.setBatchId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 배치 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 배치 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBatch> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
