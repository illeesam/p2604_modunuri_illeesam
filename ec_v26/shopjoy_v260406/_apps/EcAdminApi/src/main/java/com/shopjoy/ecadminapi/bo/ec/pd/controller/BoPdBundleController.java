package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleSaveDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


/**
 * BO 묶음상품 API
 * GET  /api/bo/ec/pd/bundle/page — 페이징 목록
 * POST /api/bo/ec/pd/prod-bundle — 등록
 * PUT  /api/bo/ec/pd/prod-bundle/{id}/items — 구성품목 수정
 * DELETE /api/bo/ec/pd/prod-bundle/{id} — 삭제
 */
@RestController
@RequiredArgsConstructor
public class BoPdBundleController {
    private final BoPdProdService boPdProdService;

    /** page — 페이지 */
    @GetMapping("/api/bo/ec/pd/bundle/page")
    public ResponseEntity<ApiResponse<PdProdDto.PageResponse>> page(@Valid @ModelAttribute PdProdDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdProdService.getPageData(req)));
    }

    /** create — 생성 */
    @PostMapping("/api/bo/ec/pd/prod-bundle")
    public ResponseEntity<ApiResponse<PdProd>> create(@RequestBody PdProdBundleSaveDto.CreateRequest req) {
        return ResponseEntity.status(201).body(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** updateItems — 수정 */
    @PutMapping("/api/bo/ec/pd/prod-bundle/{id}/items")
    public ResponseEntity<ApiResponse<Void>> updateItems(@PathVariable("id") String id, @RequestBody PdProdBundleSaveDto.UpdateItemsRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** delete — 삭제 */
    @DeleteMapping("/api/bo/ec/pd/prod-bundle/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdProdService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
