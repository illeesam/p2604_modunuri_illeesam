package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.TossCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.TossConfirmReq;
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
 * <p>결제 승인(confirm)은 반드시 서버에서 수행한다. 클라이언트는 결제창에서 받은
 * paymentKey / orderId / amount 만 전달하고, 서버는 시크릿키 Basic 인증으로
 * 토스 결제승인 API 에 호출하여 최종 승인한다. (시크릿키 노출 방지)</p>
 *
 * <p>HTTP 클라이언트: Spring RestClient (spring-web 동봉, 별도 의존성 불필요).</p>
 *
 * <p>키/URL 출처: sy_prop (path_id=app.toss, prop_profile=환경별).
 * 미설정(빈 값) 시 명확한 CmBizException 으로 거부한다.</p>
 *
 * <p>appTypeCd("BO"|"FO") 는 호출자(컨트롤러)가 전달한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmTossPayService {

    private final SyPropRepository syPropRepository;
    private final Environment environment;
    private final RestClient restClient = RestClient.create();

    /** sy_prop에서 app.toss.* 키를 현재 active profile 기준으로 조회 */
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

    /** prop_profile 매칭: "all" 또는 null → 전체, "^local^dev^" → profile 포함 여부 */
    private boolean isPropProfileMatch(String propProfile, String activeProfile) {
        if (propProfile == null || propProfile.isBlank() || "all".equals(propProfile)) return true;
        return propProfile.contains("^" + activeProfile + "^");
    }

    // ── 클라이언트키 조회 ─────────────────────────────────────────────────

    /**
     * 프론트 SDK 초기화용 클라이언트키를 반환한다. (공개 가능 키)
     *
     * @param appTypeCd "BO" 또는 "FO" (현재 동일 키 반환, 향후 사이트별 분기 여지)
     * @return { clientKey: "..." }
     */
    public Map<String, Object> getClientKey(String appTypeCd) {
        String clientKey = prop("app.toss.client-key");
        if (clientKey.isBlank()) {
            throw new CmBizException(
                "토스 클라이언트키가 설정되지 않았습니다. sy_prop : app.toss.client-key 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("clientKey", clientKey);
        return result;
    }

    // ── 결제 승인 ─────────────────────────────────────────────────────────

    /**
     * 토스 결제 승인. paymentKey / orderId / amount 를 시크릿키 Basic 인증으로
     * 토스 결제승인 API 에 전달하여 최종 승인한다.
     *
     * @param request   paymentKey / orderId / amount (컨트롤러 @Valid 검증 완료)
     * @param appTypeCd "BO" 또는 "FO"
     * @return 토스 결제승인 응답 본문(Map). 승인 실패 시 CmBizException.
     */
    @Transactional
    public Map<String, Object> confirm(TossConfirmReq request, String appTypeCd) {
        String secretKey  = prop("app.toss.secret-key");
        String confirmUrl = prop("app.toss.confirm-url");
        if (secretKey.isBlank()) {
            throw new CmBizException(
                "토스 시크릿키가 설정되지 않았습니다. sy_prop : app.toss.secret-key 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }
        if (confirmUrl.isBlank()) {
            throw new CmBizException(
                "토스 결제승인 URL이 설정되지 않았습니다. sy_prop : app.toss.confirm-url 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        // Basic 인증: username=시크릿키, password=빈 문자열 → "{secretKey}:" 를 Base64 인코딩
        String basic = "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        // 토스 confirm 요청 본문 (3개 값 그대로 전달)
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentKey", request.getPaymentKey());
        body.put("orderId",    request.getOrderId());
        body.put("amount",     request.getAmount());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> res = restClient.post()
                .uri(confirmUrl)
                .header(HttpHeaders.AUTHORIZATION, basic)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                // 4xx/5xx 도 예외 던지지 않고 본문을 읽어 토스 에러 메시지를 그대로 노출
                .onStatus(status -> status.isError(), (req, resp) -> { /* 본문 파싱 위해 무시 */ })
                .body(Map.class);

            if (res == null || res.isEmpty()) {
                throw new CmBizException(
                    "토스 결제 승인 응답이 비어 있습니다." + "::" + CmUtil.svcCallerInfo(this));
            }

            // 토스 에러 응답 형식: { "code": "...", "message": "..." } (status 필드 없음)
            // 정상 승인 응답: { "paymentKey": "...", "status": "DONE", ... }
            if (res.containsKey("code") && !res.containsKey("status")) {
                String code    = String.valueOf(res.get("code"));
                String message = res.get("message") != null ? String.valueOf(res.get("message")) : "토스 결제 승인에 실패했습니다.";
                log.warn("toss confirm failed: appTypeCd={}, orderId={}, code={}, message={}",
                    appTypeCd, request.getOrderId(), code, message);
                throw new CmBizException(message + " (" + code + ")" + "::" + CmUtil.svcCallerInfo(this));
            }

            return res;
        } catch (CmBizException e) {
            throw e;
        } catch (Exception e) {
            log.warn("toss confirm error: appTypeCd={}, orderId={}, err={}",
                appTypeCd, request.getOrderId(), e.getMessage());
            throw new CmBizException(
                "토스 결제 승인 호출에 실패했습니다. 네트워크 또는 결제 정보를 확인하세요."
                + "::" + CmUtil.svcCallerInfo(this), HttpStatus.BAD_GATEWAY);
        }
    }

    // ── 결제 취소 / 부분환불 ───────────────────────────────────────────────

    /**
     * 토스 결제 취소(전체) / 부분환불. paymentKey 로 식별되는 승인 완료 건을
     * 시크릿키 Basic 인증으로 토스 결제취소 API 에 전달하여 취소한다.
     *
     * <p>cancelReason 은 필수. cancelAmount 가 null 이면 전체취소,
     * 값이 있으면 해당 금액만 부분환불(잔액 남으면 추가 부분취소 가능).</p>
     *
     * @param request   paymentKey / cancelReason / cancelAmount (컨트롤러 @Valid 검증 완료)
     * @param appTypeCd "BO" 또는 "FO"
     * @return 토스 결제취소 응답 본문(Map). 취소 실패 시 CmBizException.
     */
    @Transactional
    public Map<String, Object> cancel(TossCancelReq request, String appTypeCd) {
        String secretKey    = prop("app.toss.secret-key");
        String cancelUrlBase = prop("app.toss.cancel-url-base");
        if (secretKey.isBlank()) {
            throw new CmBizException(
                "토스 시크릿키가 설정되지 않았습니다. sy_prop : app.toss.secret-key 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }
        if (cancelUrlBase.isBlank()) {
            throw new CmBizException(
                "토스 결제취소 URL이 설정되지 않았습니다. sy_prop : app.toss.cancel-url-base 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        // Basic 인증: username=시크릿키, password=빈 문자열 → "{secretKey}:" 를 Base64 인코딩
        String basic = "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        // 토스 취소 엔드포인트: paymentKey 가 path 에 들어감. 베이스 + "/{paymentKey}/cancel"
        String cancelUrl = cancelUrlBase + "/" + request.getPaymentKey() + "/cancel";

        // 토스 cancel 요청 본문 (cancelReason 필수, cancelAmount 있으면 부분환불)
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cancelReason", request.getCancelReason());
        if (request.getCancelAmount() != null) {
            body.put("cancelAmount", request.getCancelAmount());
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> res = restClient.post()
                .uri(cancelUrl)
                .header(HttpHeaders.AUTHORIZATION, basic)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                // 4xx/5xx 도 예외 던지지 않고 본문을 읽어 토스 에러 메시지를 그대로 노출
                .onStatus(status -> status.isError(), (req, resp) -> { /* 본문 파싱 위해 무시 */ })
                .body(Map.class);

            if (res == null || res.isEmpty()) {
                throw new CmBizException(
                    "토스 결제 취소 응답이 비어 있습니다." + "::" + CmUtil.svcCallerInfo(this));
            }

            // 토스 에러 응답 형식: { "code": "...", "message": "..." } (status 필드 없음)
            // 정상 취소 응답: { "paymentKey": "...", "status": "CANCELED"|"PARTIAL_CANCELED", ... }
            if (res.containsKey("code") && !res.containsKey("status")) {
                String code    = String.valueOf(res.get("code"));
                String message = res.get("message") != null ? String.valueOf(res.get("message")) : "토스 결제 취소에 실패했습니다.";
                log.warn("toss cancel failed: appTypeCd={}, paymentKey={}, code={}, message={}",
                    appTypeCd, request.getPaymentKey(), code, message);
                throw new CmBizException(message + " (" + code + ")" + "::" + CmUtil.svcCallerInfo(this));
            }

            return res;
        } catch (CmBizException e) {
            throw e;
        } catch (Exception e) {
            log.warn("toss cancel error: appTypeCd={}, paymentKey={}, err={}",
                appTypeCd, request.getPaymentKey(), e.getMessage());
            throw new CmBizException(
                "토스 결제 취소 호출에 실패했습니다. 네트워크 또는 결제 정보를 확인하세요."
                + "::" + CmUtil.svcCallerInfo(this), HttpStatus.BAD_GATEWAY);
        }
    }
}
