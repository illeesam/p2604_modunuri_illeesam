package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayTossCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayTossConfirmReq;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 토스페이먼츠 결제 서비스 (BO/FO 공통, co 레이어).
 *
 * <p>흐름:
 * 1. getClientKey — 프론트 SDK 초기화용 클라이언트키 반환
 * 2. confirm      — paymentKey/orderId/amount 로 결제 승인
 * 3. cancel       — paymentKey 로 전체/부분 취소
 *
 * <p>인증: 시크릿키를 "{secretKey}:" 형태로 Base64 인코딩 → Authorization: Basic {encoded}
 *
 * <p>키 출처: sy_prop (app.pay.toss.*) — BO 시스템 > 프로퍼티 관리에서 설정.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPayTossService {

    private final SyPropRepository syPropRepository;
    private final Environment environment;
    private final RestClient restClient = RestClient.create();

    /** sy_prop에서 app.pay.toss.* 키를 현재 active profile 기준으로 조회 */
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

    // ── 클라이언트키 조회 ─────────────────────────────────────────────────

    public Map<String, Object> getClientKey(String appTypeCd) {
        String clientKey = prop("app.pay.toss.client-key");
        if (clientKey.isBlank()) {
            throw new CmBizException(
                "토스 클라이언트키가 설정되지 않았습니다. sy_prop : app.pay.toss.client-key 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("clientKey", clientKey);
        return result;
    }

    // ── 결제 승인 ─────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> confirm(PayTossConfirmReq request, String appTypeCd) {
        String secretKey  = prop("app.pay.toss.secret-key");
        String confirmUrl = prop("app.pay.toss.confirm-url");
        if (secretKey.isBlank()) throw new CmBizException(
            "토스 시크릿키가 설정되지 않았습니다. sy_prop : app.pay.toss.secret-key 를 설정하세요."
            + "::" + CmUtil.svcCallerInfo(this));
        if (confirmUrl.isBlank()) confirmUrl = "https://api.tosspayments.com/v1/payments/confirm";

        String basic = "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentKey", request.getPaymentKey());
        body.put("orderId",    request.getOrderId());
        body.put("amount",     request.getAmount());

        return callToss(confirmUrl, basic, body, "confirm", appTypeCd);
    }

    // ── 결제 취소 ─────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> cancel(PayTossCancelReq request, String appTypeCd) {
        String secretKey     = prop("app.pay.toss.secret-key");
        String cancelUrlBase = prop("app.pay.toss.cancel-url-base");
        if (secretKey.isBlank()) throw new CmBizException(
            "토스 시크릿키가 설정되지 않았습니다. sy_prop : app.pay.toss.secret-key 를 설정하세요."
            + "::" + CmUtil.svcCallerInfo(this));
        if (cancelUrlBase.isBlank()) cancelUrlBase = "https://api.tosspayments.com/v1/payments";

        String basic     = "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        String cancelUrl = cancelUrlBase + "/" + request.getPaymentKey() + "/cancel";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cancelReason", request.getCancelReason());
        if (request.getCancelAmount() != null) body.put("cancelAmount", request.getCancelAmount());

        return callToss(cancelUrl, basic, body, "cancel", appTypeCd);
    }

    // ── 공통 HTTP 호출 ────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> callToss(String url, String basic, Map<String, Object> body,
                                          String op, String appTypeCd) {
        try {
            Map<String, Object> res = restClient.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, basic)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> status.isError(), (req, resp) -> {})
                .body(Map.class);

            if (res == null || res.isEmpty()) throw new CmBizException(
                "토스 결제 응답이 비어 있습니다. (" + op + ")" + "::" + CmUtil.svcCallerInfo(this));

            if (res.containsKey("code") && !res.containsKey("status")) {
                String code = String.valueOf(res.get("code"));
                String msg  = res.get("message") != null ? String.valueOf(res.get("message")) : "토스 결제 오류";
                log.warn("toss {} failed: appTypeCd={}, code={}, message={}", op, appTypeCd, code, msg);
                throw new CmBizException(msg + " (" + code + ")" + "::" + CmUtil.svcCallerInfo(this));
            }
            return res;
        } catch (CmBizException e) {
            throw e;
        } catch (Exception e) {
            log.warn("toss {} error: appTypeCd={}, err={}", op, appTypeCd, e.getMessage());
            throw new CmBizException(
                "토스 결제 API 호출에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this), HttpStatus.BAD_GATEWAY);
        }
    }
}
