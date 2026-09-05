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
 * POST /api/co/cm/naverpay/reserve  - 결제 예약 → reserveId 반환
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

    @PostMapping("/reserve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reserve(
            @RequestBody @Valid PayNaverReserveReq request) {
        return ResponseEntity.ok(ApiResponse.ok(payNaverService.reserve(request)));
    }

    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(
            @RequestBody @Valid PayNaverApproveReq request) {
        return ResponseEntity.ok(ApiResponse.ok(payNaverService.approve(request)));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestBody @Valid PayNaverCancelReq request) {
        return ResponseEntity.ok(ApiResponse.ok(payNaverService.cancel(request)));
    }
}
