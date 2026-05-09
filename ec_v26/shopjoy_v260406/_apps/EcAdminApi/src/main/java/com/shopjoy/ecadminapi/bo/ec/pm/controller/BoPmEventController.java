package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmEventService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 이벤트 API — /api/bo/ec/pm/event
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/event")
@RequiredArgsConstructor
public class BoPmEventController {
    private final BoPmEventService boPmEventService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmEventDto.Item>>> list(@Valid @ModelAttribute PmEventDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmEventService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmEventDto.PageResponse>> page(@Valid @ModelAttribute PmEventDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmEventService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventDto.Item>> getById(@PathVariable("id") String id) {
        PmEventDto.Item result = boPmEventService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmEvent>> create(@RequestBody PmEvent body) {
        PmEvent result = boPmEventService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEvent>> update(@PathVariable("id") String id, @RequestBody PmEvent body) {
        PmEvent result = boPmEventService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEvent>> upsert(@PathVariable("id") String id, @RequestBody PmEvent body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmEventService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmEventService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmEventDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        PmEventDto result = boPmEventService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<PmEvent>>> saveList(@RequestBody List<PmEvent> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boPmEventService.saveList(rows), "저장되었습니다."));
    }
}