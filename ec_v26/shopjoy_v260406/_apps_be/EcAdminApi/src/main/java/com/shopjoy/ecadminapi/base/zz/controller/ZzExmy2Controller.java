package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy2;
import com.shopjoy.ecadminapi.base.zz.service.ZzExmy2Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/zz/zz-exmy2")
@RequiredArgsConstructor
public class ZzExmy2Controller {

    private final ZzExmy2Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzExmy2Dto.Item>>> list(@Valid @ModelAttribute ZzExmy2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzExmy2Dto.PageResponse>> page(@Valid @ModelAttribute ZzExmy2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 (복합 PK) */
    @GetMapping("/{exmy1Id}/{exmy2Id}")
    public ResponseEntity<ApiResponse<ZzExmy2Dto.Item>> getById(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(exmy1Id, exmy2Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzExmy2>> create(@RequestBody ZzExmy2 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{exmy1Id}/{exmy2Id}")
    public ResponseEntity<ApiResponse<ZzExmy2>> update(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id,
            @RequestBody ZzExmy2 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(exmy1Id, exmy2Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{exmy1Id}/{exmy2Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id,
            @RequestBody ZzExmy2 entity) {
        entity.setExmy1Id(exmy1Id);
        entity.setExmy2Id(exmy2Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{exmy1Id}/{exmy2Id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id) {
        service.delete(exmy1Id, exmy2Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
