package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayNaverApproveReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayNaverCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayNaverReserveReq;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 네이버페이 결제 서비스 (BO/FO 공통, co 레이어).
 *
 * <p>흐름:
 * 1. reserve — 결제 예약 → reserveId 반환 → 프론트가 결제창 URL로 이동
 *              PC: https://pay.naver.com/payments/new?reservationId={reserveId}
 * 2. approve — returnUrl 리다이렉트 후 paymentId 로 최종 승인
 * 3. cancel  — paymentId 로 전체/부분 취소
 *
 * <p>인증: Client ID / Secret 을 X-Naver-Client-Id / X-Naver-Client-Secret 헤더로 전달.
 * 키 출처: sy_prop (app.pay.naverpay.*)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPayNaverService {

    private final SyPropRepository syPropRepository;
    private final Environment environment;
    private final RestClient restClient = RestClient.create();

    private String prop(String propKey) {
        String profile = environment.getActiveProfiles().length > 0
            ? environment.getActiveProfiles()[0] : "-";
        return syPropRepository.findAll().stream()
            .filter(p -> "Y".equals(p.getUseYn())
                && propKey.equals(p.getPropKey())
                && isPropProfileMatch(p.getPropProfile(), profile))
            .map(SyProp::getPropValue)
            .filter(v -> v != null && !v.isBlank())
            .findFirst()
            .orElse("");
    }

    private boolean isPropProfileMatch(String propProfile, String activeProfile) {
        if (propProfile == null || propProfile.isBlank() || "all".equals(propProfile)) return true;
        return propProfile.contains("^" + activeProfile + "^");
    }

    private String apiBase() {
        String base = prop("app.pay.naverpay.api-url");
        return base.isBlank() ? "https://dev.apis.naver.com/naverpay-partner/naverpay" : base;
    }

    @Transactional
    public Map<String, Object> reserve(PayNaverReserveReq req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("merchantPayKey",   req.getMerchantPayKey());
        body.put("productName",      req.getProductName());
        body.put("totalPayAmount",   req.getTotalPayAmount());
        body.put("taxScopeAmount",   req.getTaxScopeAmount() != null ? req.getTaxScopeAmount() : 0);
        body.put("taxExScopeAmount", req.getTaxExScopeAmount() != null ? req.getTaxExScopeAmount() : 0);
        body.put("returnUrl",        req.getReturnUrl());
        body.put("productCount",     1);

        return callNaver("/payments/v2.2/reserve", body);
    }

    @Transactional
    public Map<String, Object> approve(PayNaverApproveReq req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentId", req.getPaymentId());

        return callNaver("/payments/v1/approval", body);
    }

    @Transactional
    public Map<String, Object> cancel(PayNaverCancelReq req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentId",        req.getPaymentId());
        body.put("cancelAmount",     req.getCancelAmount());
        body.put("cancelReason",     req.getCancelReason());
        body.put("taxScopeAmount",   req.getTaxScopeAmount() != null ? req.getTaxScopeAmount() : 0);
        body.put("taxExScopeAmount", req.getTaxExScopeAmount() != null ? req.getTaxExScopeAmount() : 0);

        return callNaver("/payments/v1/cancel", body);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callNaver(String path, Map<String, Object> body) {
        String clientId     = prop("app.pay.naverpay.client-id");
        String clientSecret = prop("app.pay.naverpay.client-secret");
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new CmBizException(
                "네이버페이 Client ID / Secret 이 설정되지 않았습니다. " +
                "sy_prop : app.pay.naverpay.client-id / app.pay.naverpay.client-secret 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        String url = apiBase() + path;
        try {
            Map<String, Object> res = restClient.post()
                .uri(url)
                .header("X-Naver-Client-Id",     clientId)
                .header("X-Naver-Client-Secret", clientSecret)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> status.isError(), (req, resp) -> {})
                .body(Map.class);

            if (res == null || res.isEmpty()) {
                throw new CmBizException(
                    "네이버페이 응답이 비어 있습니다. (" + path + ")" + "::" + CmUtil.svcCallerInfo(this));
            }
            Object code = res.get("code");
            if (code != null && !"Success".equals(code)) {
                String msg = res.get("message") != null ? String.valueOf(res.get("message")) : "네이버페이 오류가 발생했습니다.";
                log.warn("naverpay {} failed: code={}, message={}", path, code, msg);
                throw new CmBizException(msg + " (code=" + code + ")" + "::" + CmUtil.svcCallerInfo(this));
            }
            return res;
        } catch (CmBizException e) {
            throw e;
        } catch (Exception e) {
            log.warn("naverpay {} error: {}", path, e.getMessage());
            throw new CmBizException(
                "네이버페이 API 호출에 실패했습니다. 네트워크 또는 설정을 확인하세요."
                + "::" + CmUtil.svcCallerInfo(this), HttpStatus.BAD_GATEWAY);
        }
    }
}
