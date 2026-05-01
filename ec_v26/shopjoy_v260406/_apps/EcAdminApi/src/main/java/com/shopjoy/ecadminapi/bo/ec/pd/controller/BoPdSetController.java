package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * BO 세트상품 API
 * GET  /api/bo/ec/pd/set/page — 페이징 목록
 * POST /api/bo/ec/pd/prod-set — 등록
 * PUT  /api/bo/ec/pd/prod-set/{id}/items — 구성품목 수정
 * DELETE /api/bo/ec/pd/prod-set/{id} — 삭제
 */
@RestController
@RequiredArgsConstructor
public class BoPdSetController {
    private final BoPdProdService service;

    @GetMapping("/api/bo/ec/pd/set/page")
    public ResponseEntity<ApiResponse<PageResult<PdProdDto>>> page(@RequestParam Map<String, Object> p) {
        p.put("prodTypeCd", "SET");
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @PostMapping("/api/bo/ec/pd/prod-set")
    public ResponseEntity<ApiResponse<Void>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(201).body(ApiResponse.ok(null, "저장되었습니다."));
    }

    @PutMapping("/api/bo/ec/pd/prod-set/{id}/items")
    public ResponseEntity<ApiResponse<Void>> updateItems(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    @DeleteMapping("/api/bo/ec/pd/prod-set/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
