package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy1;
import com.shopjoy.ecadminapi.base.zz.service.ZzExmy1Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/zz/zz-exmy1")
@RequiredArgsConstructor
public class ZzExmy1Controller {

    private final ZzExmy1Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzExmy1Dto.Item>>> list(@Valid @ModelAttribute ZzExmy1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzExmy1Dto.PageResponse>> page(@Valid @ModelAttribute ZzExmy1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{exmy1Id}")
    public ResponseEntity<ApiResponse<ZzExmy1Dto.Item>> getById(@PathVariable("exmy1Id") String exmy1Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(exmy1Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzExmy1>> create(@RequestBody ZzExmy1 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{exmy1Id}")
    public ResponseEntity<ApiResponse<ZzExmy1>> update(
            @PathVariable("exmy1Id") String exmy1Id, @RequestBody ZzExmy1 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(exmy1Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{exmy1Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("exmy1Id") String exmy1Id, @RequestBody ZzExmy1 entity) {
        entity.setExmy1Id(exmy1Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{exmy1Id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("exmy1Id") String exmy1Id) {
        service.delete(exmy1Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
