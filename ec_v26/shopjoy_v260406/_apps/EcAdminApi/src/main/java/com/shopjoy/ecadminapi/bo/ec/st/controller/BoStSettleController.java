package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
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
    public ResponseEntity<ApiResponse<List<StSettleDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<StSettleDto> result = boStSettleService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<StSettleDto> result = boStSettleService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleDto>> getById(@PathVariable("id") String id) {
        StSettleDto result = boStSettleService.getById(id);
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
    public ResponseEntity<ApiResponse<StSettleDto>> update(@PathVariable("id") String id, @RequestBody StSettle body) {
        StSettleDto result = boStSettleService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleDto>> upsert(@PathVariable("id") String id, @RequestBody StSettle body) {
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
    public ResponseEntity<ApiResponse<StSettleDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        StSettleDto result = boStSettleService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
