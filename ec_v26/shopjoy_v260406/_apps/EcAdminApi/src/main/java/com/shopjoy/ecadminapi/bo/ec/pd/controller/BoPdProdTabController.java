package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * BO 상품 수정 탭별 조회 API
 *
 * GET /api/bo/ec/pd/prod/{prodId}/images   — 이미지 탭
 * GET /api/bo/ec/pd/prod/{prodId}/opts     — 옵션설정 탭 (옵션그룹 + 옵션값)
 * GET /api/bo/ec/pd/prod/{prodId}/skus     — 옵션(가격/재고) 탭
 * GET /api/bo/ec/pd/prod/{prodId}/contents — 상품설명 탭
 * GET /api/bo/ec/pd/prod/{prodId}/rels     — 연관상품 탭
 */
@RestController
@RequestMapping("/api/bo/ec/pd/prod/{prodId}")
@RequiredArgsConstructor
@BoOnly
public class BoPdProdTabController {

    private final PdProdImgService     imgService;
    private final PdProdOptService     optService;
    private final PdProdOptItemService optItemService;
    private final PdProdSkuService     skuService;
    private final PdProdContentService contentService;
    private final PdProdRelService     relService;

    @GetMapping("/images")
    public ResponseEntity<ApiResponse<List<PdProdImgDto>>> images(
            @PathVariable String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(imgService.getList(p)));
    }

    @GetMapping("/opts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> opts(
            @PathVariable String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        List<PdProdOptDto> groups = optService.getList(p);

        Map<String, Object> p2 = new HashMap<>(p);
        List<PdProdOptItemDto> items = optItemService.getList(p2);

        Map<String, Object> result = new HashMap<>();
        result.put("groups", groups);
        result.put("items", items);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/skus")
    public ResponseEntity<ApiResponse<List<PdProdSkuDto>>> skus(
            @PathVariable String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(skuService.getList(p)));
    }

    @GetMapping("/contents")
    public ResponseEntity<ApiResponse<List<PdProdContentDto>>> contents(
            @PathVariable String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(contentService.getList(p)));
    }

    @GetMapping("/rels")
    public ResponseEntity<ApiResponse<List<PdProdRelDto>>> rels(
            @PathVariable String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(relService.getList(p)));
    }
}
