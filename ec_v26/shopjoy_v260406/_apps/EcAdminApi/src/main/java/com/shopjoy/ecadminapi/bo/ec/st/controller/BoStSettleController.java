package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산 API
 * GET    /api/bo/ec/st/settle       — 목록
 * GET    /api/bo/ec/st/settle/page  — 페이징
 * GET    /api/bo/ec/st/settle/{id}  — 단건
 * POST   /api/bo/ec/st/settle       — 등록
 * PUT    /api/bo/ec/st/settle/{id}  — 수정
 * DELETE /api/bo/ec/st/settle/{id}  — 삭제
 * PATCH  /api/bo/ec/st/settle/{id}/status — 상태변경
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/st/settle")
@RequiredArgsConstructor
public class BoStSettleController {
    private final BoStSettleService boStSettleService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleDto.Item>>> list(@Valid @ModelAttribute StSettleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleDto.PageResponse>> page(@Valid @ModelAttribute StSettleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleDto.Item>> getById(@PathVariable("id") String id) {
        StSettleDto.Item result = boStSettleService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettle>> create(@RequestBody StSettle body) {
        StSettle result = boStSettleService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettle>> update(@PathVariable("id") String id, @RequestBody StSettle body) {
        StSettle result = boStSettleService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettle>> upsert(@PathVariable("id") String id, @RequestBody StSettle body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<StSettleDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleService.changeStatus(id, body.get("statusCd"))));
    }
}
