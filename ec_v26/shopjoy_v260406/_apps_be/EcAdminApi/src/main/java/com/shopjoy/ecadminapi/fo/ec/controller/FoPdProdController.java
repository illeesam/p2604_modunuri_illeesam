package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoPdProdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 상품 API — 사용자 화면용
 *
 * 정책서: pd.10.상품상세-API설계.md §4 — 3계층 분리
 *
 *   목록
 *     GET  /api/fo/ec/pd/prod          — 상품 목록 (전체)
 *     GET  /api/fo/ec/pd/prod/page     — 상품 목록 (페이징)
 *
 *   Tier 1 — 첫 화면 (단일 통합)
 *     GET  /api/fo/ec/pd/prod/{id}              — prod + images + opts + skus
 *
 *   Tier 2 — 스크롤/탭 lazy load
 *     GET  /api/fo/ec/pd/prod/{id}/contents     — 상품설명
 *     GET  /api/fo/ec/pd/prod/{id}/rels         — 연관상품
 *     GET  /api/fo/ec/pd/prod/{id}/reviews      — 상품평 (있다면)
 *     GET  /api/fo/ec/pd/prod/{id}/qna          — Q&A (있다면)
 *
 *   Tier 3 — 사용자별 동적 (프로모션 통합)
 *     GET  /api/fo/ec/pd/prod/{id}/promotions   — 쿠폰/할인/사은품/이벤트
 *
 * 인가: GET → USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/pd/prod")
@RequiredArgsConstructor
public class FoPdProdController {

    private final FoPdProdService foPdProdService;

    /* ── 목록 ────────────────────────────────────────────────── */

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdDto.Item>>> list(@Valid @ModelAttribute PdProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdDto.PageResponse>> page(@Valid @ModelAttribute PdProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getPageData(req)));
    }

    /* ── Tier 1: 첫 화면 통합 (prod + images + opts + skus) ─── */

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetail(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getDetail(id)));
    }

    /* ── Tier 2: lazy load ──────────────────────────────────── */

    @GetMapping("/{id}/contents")
    public ResponseEntity<ApiResponse<List<PdProdContentDto.Item>>> getContents(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getContents(id)));
    }

    /** getRels — 조회 */
    @GetMapping("/{id}/rels")
    public ResponseEntity<ApiResponse<List<PdProdRelDto.Item>>> getRels(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getRels(id)));
    }

    /** getReviews — 조회 */
    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReviews(
            @PathVariable("id") String id,
            @Valid @ModelAttribute PdReviewDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getReviews(id, req)));
    }

    /** getReviewImages — 조회 */
    @GetMapping("/{id}/review-images")
    public ResponseEntity<ApiResponse<List<PdReviewAttachDto.Item>>> getReviewImages(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getReviewImages(id)));
    }

    /** getQna — 조회 */
    @GetMapping("/{id}/qna")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQna(
            @PathVariable("id") String id,
            @Valid @ModelAttribute PdProdQnaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getQna(id, req)));
    }

    /* ── Tier 3: 사용자별 프로모션 (통합) ───────────────────── */

    @GetMapping("/{id}/promotions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPromotions(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foPdProdService.getPromotions(id)));
    }
}
