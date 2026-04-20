package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.fo.ec.service.FoPdProdService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 상품 API — 사용자 화면용
 * GET  /api/fo/ec/pd/prod       — 상품 목록 (전체)
 * GET  /api/fo/ec/pd/prod/page  — 상품 목록 (페이징)
 * GET  /api/fo/ec/pd/prod/{id}  — 상품 상세
 *
 * 인가: GET → USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/pd/prod")
@RequiredArgsConstructor
public class FoPdProdController {

    private final FoPdProdService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String prodStatusCd,
            @RequestParam(required = false) String sort) {
        List<PdProdDto> result = service.getList(buildParam(siteId, kw, categoryId, prodStatusCd, sort));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdProdDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String prodStatusCd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        PageResult<PdProdDto> result = service.getPageData(buildParam(siteId, kw, categoryId, prodStatusCd, sort), pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdDto>> getById(@PathVariable String id) {
        PdProdDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildParam(String siteId, String kw, String categoryId, String prodStatusCd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId      != null) p.put("siteId",      siteId);
        if (kw          != null) p.put("kw",           kw);
        if (categoryId  != null) p.put("categoryId",   categoryId);
        if (prodStatusCd!= null) p.put("prodStatusCd", prodStatusCd);
        if (sort        != null) p.put("sort",          sort);
        return p;
    }
}
