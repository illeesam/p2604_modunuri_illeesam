package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.PayNaverApproveReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayNaverCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayNaverReserveReq;
import com.shopjoy.ecadminapi.co.cm.service.CmPayNaverService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 네이버페이 결제 API (BO/FO 공통, co 레이어).
 *
 * POST /api/co/cm/naverpay/reserve  - 결제 예약 → reserveId 반환 (결제창 URL 구성용)
 * POST /api/co/cm/naverpay/approve  - 결제 승인 (paymentId)
 * POST /api/co/cm/naverpay/cancel   - 결제 취소/부분환불
 *
 * /api/co/** 는 SecurityConfig 에서 permitAll.
 * sy_prop 키: app.pay.naverpay.*
 */
@RestController
@RequestMapping("/api/co/cm/naverpay")
@RequiredArgsConstructor
public class CmPayNaverController {

    private final CmPayNaverService payNaverService;

    /** reserve — 결제 예약. 응답의 reserveId 로 결제창 URL 구성 후 프론트 이동 */
    @PostMapping("/reserve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reserve(
            @RequestBody @Valid PayNaverReserveReq request) {
        Map<String, Object> result = payNaverService.reserve(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** approve — 결제 승인. returnUrl 리다이렉트 후 paymentId 전달 */
    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(
            @RequestBody @Valid PayNaverApproveReq request) {
        Map<String, Object> result = payNaverService.approve(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** cancel — 결제 취소/부분환불 */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestBody @Valid PayNaverCancelReq request) {
        Map<String, Object> result = payNaverService.cancel(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
