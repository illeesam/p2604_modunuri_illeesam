package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmDiscntService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 할인 API — /api/bo/ec/pm/discnt
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/discnt")
@RequiredArgsConstructor
public class BoPmDiscntController {
    private final BoPmDiscntService boPmDiscntService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmDiscntDto.Item>>> list(@Valid @ModelAttribute PmDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmDiscntService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmDiscntDto.PageResponse>> page(@Valid @ModelAttribute PmDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmDiscntService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntDto.Item>> getById(@PathVariable("id") String id) {
        PmDiscntDto.Item result = boPmDiscntService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmDiscnt>> create(@RequestBody PmDiscnt body) {
        PmDiscnt result = boPmDiscntService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscnt>> update(@PathVariable("id") String id, @RequestBody PmDiscnt body) {
        PmDiscnt result = boPmDiscntService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscnt>> upsert(@PathVariable("id") String id, @RequestBody PmDiscnt body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmDiscntService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmDiscntService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmDiscntDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmDiscntService.changeStatus(id, body.get("statusCd"))));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<PmDiscnt>>> saveList(@RequestBody List<PmDiscnt> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boPmDiscntService.saveList(rows), "저장되었습니다."));
    }
}