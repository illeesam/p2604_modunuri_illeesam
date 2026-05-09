package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.sy.service.ZzSample2Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/zz-sample2")
@RequiredArgsConstructor
public class ZzSample2Controller {

    private final ZzSample2Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample2Dto.Item>>> list(@Valid @ModelAttribute ZzSample2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzSample2Dto.PageResponse>> page(@Valid @ModelAttribute ZzSample2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample2Dto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample2>> create(@RequestBody ZzSample2 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample2>> update(
            @PathVariable("id") String id, @RequestBody ZzSample2 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, entity)));
    }

    /** updatePartial — 부분 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> updatePartial(
            @PathVariable("id") String id, @RequestBody ZzSample2 entity) {
        entity.setSample2Id(id);
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
    public ResponseEntity<ApiResponse<List<ZzSample2>>> saveList(@RequestBody List<ZzSample2> rows) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveList(rows), "저장되었습니다."));
    }
}
