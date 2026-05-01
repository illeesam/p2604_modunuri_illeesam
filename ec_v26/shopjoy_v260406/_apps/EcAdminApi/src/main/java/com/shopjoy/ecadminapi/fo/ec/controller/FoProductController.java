package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoPdProdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 상품 API (프론트엔드 경로 호환)
 * GET  /api/fo/product/list  — 상품 목록
 * GET  /api/fo/product/{id}  — 상품 상세
 *
 * 인가: permitAll (로그인 불필요)
 */
@RestController
@RequestMapping("/api/fo/product")
@RequiredArgsConstructor
public class FoProductController {

    private final FoPdProdService service;

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdProdDto> products = service.getList(p);
        Map<String, Object> result = new HashMap<>();
        result.put("data", products);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable String id) {
        PdProdDto product = service.getById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("data", product);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
