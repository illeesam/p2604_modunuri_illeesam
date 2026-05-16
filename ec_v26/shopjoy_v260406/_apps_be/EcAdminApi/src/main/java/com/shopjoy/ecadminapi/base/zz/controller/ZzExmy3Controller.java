package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy3;
import com.shopjoy.ecadminapi.base.zz.service.ZzExmy3Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/zz/zz-exmy3")
@RequiredArgsConstructor
public class ZzExmy3Controller {

    private final ZzExmy3Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzExmy3Dto.Item>>> list(@Valid @ModelAttribute ZzExmy3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzExmy3Dto.PageResponse>> page(@Valid @ModelAttribute ZzExmy3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 (복합 PK) */
    @GetMapping("/{exmy1Id}/{exmy2Id}/{exmy3Id}")
    public ResponseEntity<ApiResponse<ZzExmy3Dto.Item>> getById(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id,
            @PathVariable("exmy3Id") String exmy3Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(exmy1Id, exmy2Id, exmy3Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzExmy3>> create(@RequestBody ZzExmy3 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{exmy1Id}/{exmy2Id}/{exmy3Id}")
    public ResponseEntity<ApiResponse<ZzExmy3>> update(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id,
            @PathVariable("exmy3Id") String exmy3Id,
            @RequestBody ZzExmy3 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(exmy1Id, exmy2Id, exmy3Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{exmy1Id}/{exmy2Id}/{exmy3Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id,
            @PathVariable("exmy3Id") String exmy3Id,
            @RequestBody ZzExmy3 entity) {
        entity.setExmy1Id(exmy1Id);
        entity.setExmy2Id(exmy2Id);
        entity.setExmy3Id(exmy3Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{exmy1Id}/{exmy2Id}/{exmy3Id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable("exmy1Id") String exmy1Id,
            @PathVariable("exmy2Id") String exmy2Id,
            @PathVariable("exmy3Id") String exmy3Id) {
        service.delete(exmy1Id, exmy2Id, exmy3Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
