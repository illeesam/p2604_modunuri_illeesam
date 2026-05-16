package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy3;
import com.shopjoy.ecadminapi.base.zz.service.ZzSamy3Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/zz/zz-samy3")
@RequiredArgsConstructor
public class ZzSamy3Controller {

    private final ZzSamy3Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSamy3Dto.Item>>> list(@Valid @ModelAttribute ZzSamy3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzSamy3Dto.PageResponse>> page(@Valid @ModelAttribute ZzSamy3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{samy3Id}")
    public ResponseEntity<ApiResponse<ZzSamy3Dto.Item>> getById(@PathVariable("samy3Id") String samy3Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(samy3Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSamy3>> create(@RequestBody ZzSamy3 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{samy3Id}")
    public ResponseEntity<ApiResponse<ZzSamy3>> update(
            @PathVariable("samy3Id") String samy3Id, @RequestBody ZzSamy3 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(samy3Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{samy3Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("samy3Id") String samy3Id, @RequestBody ZzSamy3 entity) {
        entity.setSamy3Id(samy3Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{samy3Id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("samy3Id") String samy3Id) {
        service.delete(samy3Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
