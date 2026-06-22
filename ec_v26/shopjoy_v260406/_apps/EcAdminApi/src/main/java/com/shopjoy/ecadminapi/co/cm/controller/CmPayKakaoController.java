package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.PayKakaoApproveReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayKakaoCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayKakaoReadyReq;
import com.shopjoy.ecadminapi.co.cm.service.CmPayKakaoService;
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
 * 카카오페이 결제 API (BO/FO 공통, co 레이어).
 *
 * POST /api/co/cm/kakaopay/ready    - 결제 준비 → next_redirect_pc_url 반환
 * POST /api/co/cm/kakaopay/approve  - 결제 승인 (pg_token + tid)
 * POST /api/co/cm/kakaopay/cancel   - 결제 취소/부분환불
 *
 * /api/co/** 는 SecurityConfig 에서 permitAll.
 * sy_prop 키: app.pay.kakaopay.*
 */
@RestController
@RequestMapping("/api/co/cm/kakaopay")
@RequiredArgsConstructor
public class CmPayKakaoController {

    private final CmPayKakaoService payKakaoService;

    /** ready — 결제 준비. 응답의 next_redirect_pc_url 로 결제창 이동 */
    @PostMapping("/ready")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ready(
            @RequestBody @Valid PayKakaoReadyReq request) {
        Map<String, Object> result = payKakaoService.ready(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** approve — 결제 승인. approvalUrl 리다이렉트 후 pg_token + tid 전달 */
    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(
            @RequestBody @Valid PayKakaoApproveReq request) {
        Map<String, Object> result = payKakaoService.approve(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** cancel — 결제 취소/부분환불 */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestBody @Valid PayKakaoCancelReq request) {
        Map<String, Object> result = payKakaoService.cancel(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
