package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.fo.ec.service.FoPmCacheService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * FO 캐쉬(충전금) API
 * GET /api/fo/ec/pm/cache/balance — 현재 회원 잔액
 *
 * 인가: USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/pm/cache")
@RequiredArgsConstructor
public class FoPmCacheController {

    private final FoPmCacheService service;

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<Map<String, Long>>> balance(
            @RequestParam(required = false) String siteId) {
        long bal = service.getBalance(siteId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("balance", bal)));
    }
}
