package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<ApiResponse<List<PdProdDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PdProdDto> result = boPdProdService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdProdDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PdProdDto> result = boPdProdService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdDto>> getById(@PathVariable("id") String id) {
        PdProdDto result = boPdProdService.getById(id);
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
    public ResponseEntity<ApiResponse<PdProdDto>> update(@PathVariable("id") String id, @RequestBody PdProd body) {
        PdProdDto result = boPdProdService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdDto>> upsert(@PathVariable("id") String id, @RequestBody PdProd body) {
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
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProd> rows) {
        boPdProdService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}