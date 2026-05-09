package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 상품 API
 * GET    /api/bo/ec/pd/prod       — 목록
 * GET    /api/bo/ec/pd/prod/page  — 페이징
 * GET    /api/bo/ec/pd/prod/{id}  — 단건
 * POST   /api/bo/ec/pd/prod       — 등록
 * PUT    /api/bo/ec/pd/prod/{id}  — 수정
 * DELETE /api/bo/ec/pd/prod/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/prod")
@RequiredArgsConstructor
public class BoPdProdController {
    private final BoPdProdService boPdProdService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdDto.Item>>> list(@Valid @ModelAttribute PdProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdDto.PageResponse>> page(@Valid @ModelAttribute PdProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdDto.Item>> getById(@PathVariable("id") String id) {
        PdProdDto.Item result = boPdProdService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProd>> create(@RequestBody PdProd body) {
        PdProd result = boPdProdService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProd>> update(@PathVariable("id") String id, @RequestBody PdProd body) {
        PdProd result = boPdProdService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProd>> upsert(@PathVariable("id") String id, @RequestBody PdProd body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdProdService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<PdProd>>> saveList(@RequestBody List<PdProd> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdService.saveList(rows), "저장되었습니다."));
    }
}