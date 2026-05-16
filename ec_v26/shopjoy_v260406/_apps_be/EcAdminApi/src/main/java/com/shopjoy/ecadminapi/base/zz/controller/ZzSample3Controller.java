package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;
import com.shopjoy.ecadminapi.base.zz.service.ZzSample3Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/zz-sample3")
@RequiredArgsConstructor
public class ZzSample3Controller {

    private final ZzSample3Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample3Dto.Item>>> list(@Valid @ModelAttribute ZzSample3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzSample3Dto.PageResponse>> page(@Valid @ModelAttribute ZzSample3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample3Dto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample3>> create(@RequestBody ZzSample3 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample3>> update(
            @PathVariable("id") String id, @RequestBody ZzSample3 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("id") String id, @RequestBody ZzSample3 entity) {
        entity.setSample3Id(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<ZzSample3> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
