package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy1;
import com.shopjoy.ecadminapi.base.zz.service.ZzSamy1Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/zz/zz-samy1")
@RequiredArgsConstructor
public class ZzSamy1Controller {

    private final ZzSamy1Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSamy1Dto.Item>>> list(@Valid @ModelAttribute ZzSamy1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzSamy1Dto.PageResponse>> page(@Valid @ModelAttribute ZzSamy1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{samy1Id}")
    public ResponseEntity<ApiResponse<ZzSamy1Dto.Item>> getById(@PathVariable("samy1Id") String samy1Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(samy1Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSamy1>> create(@RequestBody ZzSamy1 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{samy1Id}")
    public ResponseEntity<ApiResponse<ZzSamy1>> update(
            @PathVariable("samy1Id") String samy1Id, @RequestBody ZzSamy1 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(samy1Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{samy1Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("samy1Id") String samy1Id, @RequestBody ZzSamy1 entity) {
        entity.setSamy1Id(samy1Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{samy1Id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("samy1Id") String samy1Id) {
        service.delete(samy1Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
