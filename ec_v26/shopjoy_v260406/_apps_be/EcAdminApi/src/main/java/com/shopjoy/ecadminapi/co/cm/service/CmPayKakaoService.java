package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayKakaoApproveReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayKakaoCancelReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.PayKakaoReadyReq;
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
 * 카카오페이 결제 서비스 (BO/FO 공통, co 레이어).
 *
 * <p>흐름:
 * 1. ready   — 결제 준비 → next_redirect_pc_url 반환 → 프론트에서 결제창 열기
 * 2. approve — approvalUrl 리다이렉트 후 pg_token + tid 로 최종 승인
 * 3. cancel  — tid 로 전체/부분 취소
 *
 * <p>인증: Secret Key를 Authorization 헤더에 "SECRET_KEY {secretKey}" 형식으로 전달.
 * 키 출처: sy_prop (app.pay.kakaopay.*)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPayKakaoService {

    private static final String KAKAOPAY_API_BASE = "https://open-api.kakaopay.com/online/v1/payment";

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

    private String secretKeyHeader() {
        String secretKey = prop("app.pay.kakaopay.secret-key");
        if (secretKey.isBlank()) {
            throw new CmBizException(
                "카카오페이 Secret Key 가 설정되지 않았습니다. sy_prop : app.pay.kakaopay.secret-key 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }
        return "SECRET_KEY " + secretKey;
    }

    @Transactional
    public Map<String, Object> ready(PayKakaoReadyReq req) {
        String cid = prop("app.pay.kakaopay.cid");
        if (cid.isBlank()) {
            throw new CmBizException(
                "카카오페이 CID 가 설정되지 않았습니다. sy_prop : app.pay.kakaopay.cid 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid",              cid);
        body.put("partner_order_id", req.getPartnerOrderId());
        body.put("partner_user_id",  req.getPartnerUserId());
        body.put("item_name",        req.getItemName());
        body.put("quantity",         1);
        body.put("total_amount",     req.getTotalAmount());
        body.put("tax_free_amount",  req.getTaxFreeAmount() != null ? req.getTaxFreeAmount() : 0);
        body.put("approval_url",     req.getApprovalUrl());
        body.put("cancel_url",       req.getCancelUrl());
        body.put("fail_url",         req.getFailUrl());

        return callKakao("/ready", body);
    }

    @Transactional
    public Map<String, Object> approve(PayKakaoApproveReq req) {
        String cid = prop("app.pay.kakaopay.cid");
        if (cid.isBlank()) {
            throw new CmBizException(
                "카카오페이 CID 가 설정되지 않았습니다. sy_prop : app.pay.kakaopay.cid 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid",              cid);
        body.put("tid",              req.getTid());
        body.put("partner_order_id", req.getPartnerOrderId());
        body.put("partner_user_id",  req.getPartnerUserId());
        body.put("pg_token",         req.getPgToken());

        return callKakao("/approve", body);
    }

    @Transactional
    public Map<String, Object> cancel(PayKakaoCancelReq req) {
        String cid = prop("app.pay.kakaopay.cid");
        if (cid.isBlank()) {
            throw new CmBizException(
                "카카오페이 CID 가 설정되지 않았습니다. sy_prop : app.pay.kakaopay.cid 를 설정하세요."
                + "::" + CmUtil.svcCallerInfo(this));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid",                    cid);
        body.put("tid",                    req.getTid());
        body.put("cancel_amount",          req.getCancelAmount());
        body.put("cancel_tax_free_amount", req.getCancelTaxFreeAmount() != null ? req.getCancelTaxFreeAmount() : 0);
        if (req.getCancelReason() != null && !req.getCancelReason().isBlank()) {
            body.put("cancel_reason", req.getCancelReason());
        }

        return callKakao("/cancel", body);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callKakao(String path, Map<String, Object> body) {
        String url = KAKAOPAY_API_BASE + path;
        try {
            Map<String, Object> res = restClient.post()
                .uri(url)
                .header("Authorization", secretKeyHeader())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> status.isError(), (req, resp) -> {})
                .body(Map.class);

            if (res == null || res.isEmpty()) {
                throw new CmBizException(
                    "카카오페이 응답이 비어 있습니다. (" + path + ")" + "::" + CmUtil.svcCallerInfo(this));
            }
            if (res.containsKey("code") && res.get("code") instanceof Number n && n.intValue() < 0) {
                String msg = res.get("msg") != null ? String.valueOf(res.get("msg")) : "카카오페이 오류가 발생했습니다.";
                log.warn("kakaopay {} failed: code={}, msg={}", path, n, msg);
                throw new CmBizException(msg + " (code=" + n + ")" + "::" + CmUtil.svcCallerInfo(this));
            }
            return res;
        } catch (CmBizException e) {
            throw e;
        } catch (Exception e) {
            log.warn("kakaopay {} error: {}", path, e.getMessage());
            throw new CmBizException(
                "카카오페이 API 호출에 실패했습니다. 네트워크 또는 설정을 확인하세요."
                + "::" + CmUtil.svcCallerInfo(this), HttpStatus.BAD_GATEWAY);
        }
    }
}
