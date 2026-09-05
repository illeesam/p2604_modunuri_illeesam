package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.TossCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.TossConfirmReq;
import com.shopjoy.ecadminapi.co.cm.service.CmTossPayService;
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
 * GET  /api/co/cm/toss/client-key   - 프론트 SDK 초기화용 클라이언트키 조회
 * POST /api/co/cm/toss/confirm      - 결제 승인 (paymentKey/orderId/amount → 토스 confirm)
 * POST /api/co/cm/toss/cancel       - 결제 취소/부분환불 (paymentKey/cancelReason/cancelAmount? → 토스 cancel)
 *
 * <p>/api/co/** 는 SecurityConfig 에서 permitAll 이므로 별도 보안 설정 불필요.
 * appTypeCd("BO"|"FO") 는 쿼리 파라미터로 받아 서비스에 전달한다(미전달 시 FO).</p>
 */
@RestController
@RequestMapping("/api/co/cm/toss")
@RequiredArgsConstructor
public class CmTossPayController {

    private final CmTossPayService tossPayService;

    /** clientKey — 프론트 SDK 초기화용 클라이언트키 조회 */
    @GetMapping("/client-key")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clientKey(
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        Map<String, Object> result = tossPayService.getClientKey(appTypeCd);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** confirm — 결제 승인 (서버에서 시크릿키 Basic 인증으로 토스 confirm 호출) */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirm(
            @RequestBody @Valid TossConfirmReq request,
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        Map<String, Object> result = tossPayService.confirm(request, appTypeCd);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** cancel — 결제 취소/부분환불 (서버에서 시크릿키 Basic 인증으로 토스 cancel 호출) */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestBody @Valid TossCancelReq request,
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        Map<String, Object> result = tossPayService.cancel(request, appTypeCd);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
