package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.co.cm.data.vo.TossCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.TossConfirmReq;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
 * <p>HTTP 클라이언트: Spring RestClient (spring-web 동봉, 별도 의존성 불필요).
 * SocialTokenVerifier 의 외부 HTTP 호출 패턴을 그대로 따른다.</p>
 *
 * <p>시크릿키 출처: application.yml 의 toss.secret-key (환경변수 TOSS_SECRET_KEY 주입 권장).
 * 미설정(빈 값) 시 명확한 CmBizException 으로 거부한다. 기본값은 토스 공식 문서용 테스트
 * 시크릿키(test_gsk_*)로, 프론트 폴백 테스트 클라이언트키(test_gck_docs_*)와 짝을 이룬다.</p>
 *
 * <p>appTypeCd("BO"|"FO") 는 호출자(컨트롤러)가 전달한다. 현재 승인 로직은 BO/FO 동일하지만
 * 향후 사이트별 시크릿키 분기·감사 로그 분리 등을 위해 시그니처에 유지한다.</p>
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class CmTossPayService {

    /** 토스 결제승인 API 엔드포인트. 설정값으로 외부화(테스트 시 모의 서버 지정 가능). */
    private final String confirmUrl;

    /**
     * 토스 결제취소 API 베이스 URL. 실제 호출 시 "/{paymentKey}/cancel" 을 덧붙인다.
     * paymentKey 가 path 에 들어가므로 confirm-url 처럼 완성형으로 외부화하지 못하고
     * 베이스만 외부화한다(테스트 시 모의 서버 지정 가능).
     */
    private final String cancelUrlBase;

    /** 토스 시크릿키 (Basic 인증의 username, 비밀번호는 빈 문자열). */
    private final String secretKey;

    /** 클라이언트키 (프론트 SDK 초기화용). client-key 조회 엔드포인트에서 반환. */
    private final String clientKey;

    private final RestClient restClient;

    public CmTossPayService(
            @Value("${toss.confirm-url:https://api.tosspayments.com/v1/payments/confirm}") String confirmUrl,
            @Value("${toss.cancel-url-base:https://api.tosspayments.com/v1/payments}") String cancelUrlBase,
            @Value("${toss.secret-key:test_gsk_docs_GjLJoQ1aVZ8yMnpZ0vlrrPmOoBN0}") String secretKey,
            @Value("${toss.client-key:test_gck_docs_Ovk5rk1gB5Nrm6CzWlVWax}") String clientKey) {
        this.confirmUrl    = confirmUrl;
        this.cancelUrlBase = cancelUrlBase;
        this.secretKey     = secretKey;
        this.clientKey     = clientKey;
        this.restClient    = RestClient.create();
    }

    // ── 클라이언트키 조회 ─────────────────────────────────────────────────

    /**
     * 프론트 SDK 초기화용 클라이언트키를 반환한다. (공개 가능 키)
     *
     * @param appTypeCd "BO" 또는 "FO" (현재 동일 키 반환, 향후 사이트별 분기 여지)
     * @return { clientKey: "..." }
     */
    public Map<String, Object> getClientKey(String appTypeCd) {
        if (clientKey == null || clientKey.isBlank()) {
            throw new CmBizException(
                "토스 클라이언트키가 설정되지 않았습니다. application.yml 의 toss.client-key 를 설정하세요."
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
        if (secretKey == null || secretKey.isBlank()) {
            throw new CmBizException(
                "토스 시크릿키가 설정되지 않았습니다. application.yml 의 toss.secret-key (또는 환경변수 TOSS_SECRET_KEY) 를 설정하세요."
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
        if (secretKey == null || secretKey.isBlank()) {
            throw new CmBizException(
                "토스 시크릿키가 설정되지 않았습니다. application.yml 의 toss.secret-key (또는 환경변수 TOSS_SECRET_KEY) 를 설정하세요."
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
