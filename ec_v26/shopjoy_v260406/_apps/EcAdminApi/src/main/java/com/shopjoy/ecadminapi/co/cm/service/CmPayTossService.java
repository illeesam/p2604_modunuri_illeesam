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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 토스페이먼츠 결제 서비스 (BO/FO 공통, co 레이어).
 *
 * <p>흐름:
 * 1. getClientKey — 프론트 SDK 초기화용 클라이언트키 반환
 * 2. confirm      — paymentKey/orderId/amount 로 결제 승인 → od_pay 갱신
 * 3. cancel       — paymentKey 로 전체/부분 취소 → 금액 검증 → od_pay 갱신
 *
 * <p>인증: 시크릿키를 "{secretKey}:" 형태로 Base64 인코딩 → Authorization: Basic {encoded}
 *
 * <p>키 출처: sy_prop (app.pay.toss.*) — BO 시스템 > 프로퍼티 관리에서 설정.
 *
 * <p>DB 갱신 범위 (co 레이어 한정):
 * - confirm 후: od_pay.pay_status_cd=DONE, payment_key, balance_amt=pay_amt, pay_date
 * - cancel 후:  od_pay.refund_amt+=cancelAmount, balance_amt=토스응답, pay_status_cd(DONE/CANCELED)
 * 운영 도메인 후처리(od_order 상태, od_refund INSERT, 재고 복구 등)는 bo/od 서비스에서 별도 수행.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPayTossService {

    private final SyPropRepository syPropRepository;
    private final Environment      environment;
    private final JdbcTemplate     jdbcTemplate;
    private final RestClient restClient = RestClient.create();

    // ── sy_prop 조회 ─────────────────────────────────────────────────────

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

    private String secretBasic() {
        String secretKey = prop("app.pay.toss.secret-key");
        if (secretKey.isBlank()) throw new CmBizException(
            "토스 시크릿키가 설정되지 않았습니다. sy_prop : app.pay.toss.secret-key 를 설정하세요."
            + "::" + CmUtil.svcCallerInfo(this));
        return "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
    }

    // ── 클라이언트키 조회 ─────────────────────────────────────────────────

    public Map<String, Object> getClientKey(String appTypeCd) {
        String clientKey = prop("app.pay.toss.client-key");
        if (clientKey.isBlank()) throw new CmBizException(
            "토스 클라이언트키가 설정되지 않았습니다. sy_prop : app.pay.toss.client-key 를 설정하세요."
            + "::" + CmUtil.svcCallerInfo(this));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("clientKey", clientKey);
        return result;
    }

    // ── 결제 승인 ─────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> confirm(PayTossConfirmReq request, String appTypeCd) {
        String confirmUrl = prop("app.pay.toss.confirm-url");
        if (confirmUrl.isBlank()) confirmUrl = "https://api.tosspayments.com/v1/payments/confirm";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentKey", request.getPaymentKey());
        body.put("orderId",    request.getOrderId());
        body.put("amount",     request.getAmount());

        Map<String, Object> tossRes = callToss(confirmUrl, secretBasic(), body, "confirm", appTypeCd);

        // od_pay 갱신 — payment_key / balance_amt / pay_status_cd / pay_date
        // orderId 기준으로 PENDING 상태 od_pay 를 찾아 갱신 (운영 흐름: pre-save 시 orderId로 INSERT됨)
        try {
            String status      = toString(tossRes.get("status")); // DONE / VIRTUAL_ACCOUNT_ISSUED 등
            String paymentKey  = toString(tossRes.get("paymentKey"));
            Object totalAmt    = tossRes.get("totalAmount");
            long   payAmt      = totalAmt != null ? ((Number) totalAmt).longValue() : request.getAmount();

            int updated = jdbcTemplate.update(
                "UPDATE od_pay SET payment_key=?, pay_status_cd=?, pay_status_cd_before=pay_status_cd," +
                " balance_amt=?, pay_date=CURRENT_TIMESTAMP, upd_date=CURRENT_TIMESTAMP" +
                " WHERE order_id=? AND pay_status_cd='PENDING'",
                paymentKey, status, payAmt, request.getOrderId()
            );
            if (updated == 0) {
                log.info("toss confirm: od_pay PENDING 행 없음 — orderId={} (시뮬 또는 pre-save 미구현)", request.getOrderId());
            }
        } catch (Exception e) {
            // DB 갱신 실패는 로그만 — 토스 승인은 이미 완료됐으므로 예외로 롤백하지 않음
            log.warn("toss confirm: od_pay 갱신 실패 (orderId={}) — {}", request.getOrderId(), e.getMessage());
        }

        return tossRes;
    }

    // ── 결제 취소 ─────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> cancel(PayTossCancelReq request, String appTypeCd) {

        // 1) od_pay 조회 — payment_key 기준으로 잔여 금액(balance_amt) 및 현재 상태 확인
        Map<String, Object> odPay = findOdPayByPaymentKey(request.getPaymentKey());

        // 2) 부분취소 금액 검증 (cancelAmount 가 있는 경우만)
        if (request.getCancelAmount() != null && odPay != null) {
            long balanceAmt = odPay.get("balance_amt") != null
                ? ((Number) odPay.get("balance_amt")).longValue() : 0L;
            String payStatus = toString(odPay.get("pay_status_cd"));

            if ("CANCELED".equals(payStatus)) throw new CmBizException(
                "이미 전액 취소된 결제입니다. (pay_status_cd=CANCELED)" + "::" + CmUtil.svcCallerInfo(this));

            if (balanceAmt <= 0) throw new CmBizException(
                "잔여 취소 가능 금액이 없습니다. (balance_amt=" + balanceAmt + ")" + "::" + CmUtil.svcCallerInfo(this));

            if (request.getCancelAmount() > balanceAmt) throw new CmBizException(
                "취소 금액(" + request.getCancelAmount() + "원)이 잔여 취소 가능 금액(" + balanceAmt + "원)을 초과합니다."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3) 토스 cancel API 호출
        String cancelUrlBase = prop("app.pay.toss.cancel-url-base");
        if (cancelUrlBase.isBlank()) cancelUrlBase = "https://api.tosspayments.com/v1/payments";
        String cancelUrl = cancelUrlBase + "/" + request.getPaymentKey() + "/cancel";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cancelReason", request.getCancelReason());
        if (request.getCancelAmount() != null) body.put("cancelAmount", request.getCancelAmount());
        // 무통장/가상계좌 환불 계좌 정보
        if (request.getRefundHolderName() != null) {
            Map<String, Object> refundAcc = new LinkedHashMap<>();
            refundAcc.put("holderName",     request.getRefundHolderName());
            refundAcc.put("bank",           request.getRefundBank());
            refundAcc.put("accountNumber",  request.getRefundAccountNumber());
            body.put("refundReceiveAccount", refundAcc);
        }

        Map<String, Object> tossRes = callToss(cancelUrl, secretBasic(), body, "cancel", appTypeCd);

        // 4) od_pay 갱신 — 토스 응답의 balanceAmount / status 기준으로 동기화
        try {
            String newStatus  = toString(tossRes.get("status")); // CANCELED or DONE
            Object balanceObj = tossRes.get("balanceAmount");
            long   newBalance = balanceObj != null ? ((Number) balanceObj).longValue() : 0L;

            // 환불 누적액 = pay_amt - balanceAmount
            Object totalAmtObj = tossRes.get("totalAmount");
            long   totalAmt    = totalAmtObj != null ? ((Number) totalAmtObj).longValue() : 0L;
            long   refundAmt   = totalAmt - newBalance;

            int updated = jdbcTemplate.update(
                "UPDATE od_pay SET pay_status_cd=?, pay_status_cd_before=pay_status_cd," +
                " balance_amt=?, refund_amt=?, refund_status_cd=?," +
                " refund_date=CASE WHEN ?='CANCELED' THEN CURRENT_TIMESTAMP ELSE refund_date END," +
                " refund_reason=COALESCE(refund_reason, ?), upd_date=CURRENT_TIMESTAMP" +
                " WHERE payment_key=?",
                newStatus, newBalance, refundAmt,
                newBalance == 0 ? "COMPLT" : "PARTIAL",
                newStatus, request.getCancelReason(),
                request.getPaymentKey()
            );
            if (updated == 0) {
                log.info("toss cancel: od_pay payment_key 행 없음 — paymentKey={} (시뮬 모드)", request.getPaymentKey());
            }
        } catch (Exception e) {
            log.warn("toss cancel: od_pay 갱신 실패 (paymentKey={}) — {}", request.getPaymentKey(), e.getMessage());
        }

        return tossRes;
    }

    // ── 내부 헬퍼 ─────────────────────────────────────────────────────────

    /** od_pay 에서 payment_key 로 행 조회. 없으면 null 반환 (시뮬 모드 허용). */
    private Map<String, Object> findOdPayByPaymentKey(String paymentKey) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT pay_id, pay_amt, balance_amt, pay_status_cd, refund_amt" +
                " FROM od_pay WHERE payment_key = ? LIMIT 1",
                paymentKey
            );
            return rows.isEmpty() ? null : rows.get(0);
        } catch (Exception e) {
            log.warn("toss cancel: od_pay 조회 실패 (paymentKey={}) — {}", paymentKey, e.getMessage());
            return null;
        }
    }

    private static String toString(Object v) {
        return v != null ? String.valueOf(v) : "";
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
