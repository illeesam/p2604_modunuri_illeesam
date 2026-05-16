package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy2;
import com.shopjoy.ecadminapi.base.zz.service.ZzSamy2Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/zz/zz-samy2")
@RequiredArgsConstructor
public class ZzSamy2Controller {

    private final ZzSamy2Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSamy2Dto.Item>>> list(@Valid @ModelAttribute ZzSamy2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzSamy2Dto.PageResponse>> page(@Valid @ModelAttribute ZzSamy2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{samy2Id}")
    public ResponseEntity<ApiResponse<ZzSamy2Dto.Item>> getById(@PathVariable("samy2Id") String samy2Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(samy2Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSamy2>> create(@RequestBody ZzSamy2 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{samy2Id}")
    public ResponseEntity<ApiResponse<ZzSamy2>> update(
            @PathVariable("samy2Id") String samy2Id, @RequestBody ZzSamy2 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(samy2Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{samy2Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("samy2Id") String samy2Id, @RequestBody ZzSamy2 entity) {
        entity.setSamy2Id(samy2Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{samy2Id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("samy2Id") String samy2Id) {
        service.delete(samy2Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
