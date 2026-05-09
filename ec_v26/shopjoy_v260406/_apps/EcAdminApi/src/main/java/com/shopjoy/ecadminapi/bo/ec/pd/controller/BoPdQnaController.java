package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdQnaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 상품 QnA API
 * GET    /api/bo/ec/pd/qna       — 목록
 * GET    /api/bo/ec/pd/qna/page  — 페이징
 * GET    /api/bo/ec/pd/qna/{id}  — 단건
 * POST   /api/bo/ec/pd/qna       — 등록
 * PUT    /api/bo/ec/pd/qna/{id}  — 수정
 * DELETE /api/bo/ec/pd/qna/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/qna")
@RequiredArgsConstructor
public class BoPdQnaController {
    private final BoPdQnaService boPdQnaService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdQnaDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PdProdQnaDto> result = boPdQnaService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdProdQnaDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PdProdQnaDto> result = boPdQnaService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQnaDto>> getById(@PathVariable("id") String id) {
        PdProdQnaDto result = boPdQnaService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdQna>> create(@RequestBody PdProdQna body) {
        PdProdQna result = boPdQnaService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQnaDto>> update(@PathVariable("id") String id, @RequestBody PdProdQna body) {
        PdProdQnaDto result = boPdQnaService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQnaDto>> upsert(@PathVariable("id") String id, @RequestBody PdProdQna body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdQnaService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdQnaService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** answer */
    @PutMapping("/{id}/answer")
    public ResponseEntity<ApiResponse<PdProdQnaDto>> answer(
            @PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdQnaService.saveAnswer(id, body)));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<PdProdQna>>> saveList(@RequestBody List<PdProdQna> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boPdQnaService.saveList(rows), "저장되었습니다."));
    }
}