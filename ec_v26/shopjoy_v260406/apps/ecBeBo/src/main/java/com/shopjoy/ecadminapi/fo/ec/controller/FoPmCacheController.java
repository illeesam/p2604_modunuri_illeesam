package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmCacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    private final FoPmCacheService foPmCacheService;

    /** balance */
    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<PmCacheDto.BalanceRes>> balance(@Valid @ModelAttribute PmCacheDto.Request req) {
        long bal = foPmCacheService.getBalance(req);
        return ResponseEntity.ok(ApiResponse.ok(new PmCacheDto.BalanceRes(bal)));
    }
}
