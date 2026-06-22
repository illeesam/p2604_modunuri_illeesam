package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.PayTossCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayTossConfirmReq;
import com.shopjoy.ecadminapi.co.cm.service.CmPayTossService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 토스페이먼츠 결제 API (BO/FO 공통, co 레이어).
 *
 * GET  /api/co/cm/toss/client-key  - 프론트 SDK 초기화용 클라이언트키 조회
 * POST /api/co/cm/toss/confirm     - 결제 승인
 * POST /api/co/cm/toss/cancel      - 결제 취소/부분환불
 *
 * /api/co/** 는 SecurityConfig 에서 permitAll.
 * sy_prop 키: app.pay.toss.*
 */
@RestController
@RequestMapping("/api/co/cm/toss")
@RequiredArgsConstructor
public class CmPayTossController {

    private final CmPayTossService payTossService;

    @GetMapping("/client-key")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clientKey(
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        return ResponseEntity.ok(ApiResponse.ok(payTossService.getClientKey(appTypeCd)));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirm(
            @RequestBody @Valid PayTossConfirmReq request,
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        return ResponseEntity.ok(ApiResponse.ok(payTossService.confirm(request, appTypeCd)));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestBody @Valid PayTossCancelReq request,
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        return ResponseEntity.ok(ApiResponse.ok(payTossService.cancel(request, appTypeCd)));
    }
}
