package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdReviewService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 리뷰 API
 * GET    /api/bo/ec/pd/review       — 목록
 * GET    /api/bo/ec/pd/review/page  — 페이징
 * GET    /api/bo/ec/pd/review/{id}  — 단건
 * POST   /api/bo/ec/pd/review       — 등록
 * PUT    /api/bo/ec/pd/review/{id}  — 수정
 * DELETE /api/bo/ec/pd/review/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/review")
@RequiredArgsConstructor
@UserOnly
public class BoPdReviewController {
    private final BoPdReviewService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdReviewDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw, dateStart, dateEnd)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdReviewDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, dateStart, dateEnd, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdReview>> create(@RequestBody PdReview body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewDto>> update(@PathVariable String id, @RequestBody PdReview body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
