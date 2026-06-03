package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdReviewService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/review")
@RequiredArgsConstructor
public class BoPdReviewController {
    private final BoPdReviewService boPdReviewService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdReviewDto.Item>>> list(@Valid @ModelAttribute PdReviewDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdReviewService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdReviewDto.PageResponse>> page(@Valid @ModelAttribute PdReviewDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdReviewService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewDto.Item>> getById(@PathVariable("id") String id) {
        PdReviewDto.Item result = boPdReviewService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdReview>> create(@RequestBody PdReview body) {
        PdReview result = boPdReviewService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReview>> update(@PathVariable("id") String id, @RequestBody PdReview body) {
        PdReview result = boPdReviewService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReview>> upsert(@PathVariable("id") String id, @RequestBody PdReview body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdReviewService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdReviewService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PdReviewDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody PdReviewChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdReviewService.changeStatus(id, req.getReviewStatusCd())));
    }
    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdReview> rows) {
        switch (cmd) {
            case "base" -> boPdReviewService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}