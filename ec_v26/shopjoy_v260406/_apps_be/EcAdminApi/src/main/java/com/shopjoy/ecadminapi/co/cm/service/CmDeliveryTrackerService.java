package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Delivery Tracker(tracker.delivery) GraphQL API 서비스.
 *
 * <p>스윗트래커 미지원 택배사 또는 스윗트래커 API 키 미설정 시 fallback으로 사용.
 * <p>무료 플랜: 월 100건 (GraphQL 쿼리 1건 = 배송 1건 조회)
 * <p>발급: https://tracker.delivery → 로그인 → 개발자 → API Key 발급
 * <p>키 관리: sy_prop(app.courier.delivery-tracker.client-id / secret)
 *
 * <p>지원 택배사 carrier ID (sy_code COURIER 그룹 매핑):
 * <ul>
 *   <li>CJ     → kr.cjlogistics</li>
 *   <li>LOTTE  → kr.lotte</li>
 *   <li>HANJIN → kr.hanjin</li>
 *   <li>POST   → kr.epost</li>
 *   <li>LOGEN  → kr.logen</li>
 *   <li>COUPANG → kr.coupang (쿠팡로켓)</li>
 *   <li>GDEX   → my.gdex (GDEX Malaysia 등 해외 지원)</li>
 * </ul>
 * 전체 목록: https://tracker.delivery/en/carriers
 *
 * <p>배송상태(status.code) → 내부 DLIV_STATUS 변환:
 * <ul>
 *   <li>INFORMATION_RECEIVED → READY</li>
 *   <li>AT_PICKUP            → SHIPPED</li>
 *   <li>IN_TRANSIT           → IN_TRANSIT</li>
 *   <li>OUT_FOR_DELIVERY     → IN_TRANSIT</li>
 *   <li>DELIVERED            → DELIVERED</li>
 *   <li>ATTEMPT_FAIL / EXCEPTION / RETURNED / LOST → FAILED</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDeliveryTrackerService {

    private static final String PROP_CLIENT_ID = "app.courier.delivery-tracker.client-id";
    private static final String PROP_SECRET    = "app.courier.delivery-tracker.secret";

    private static final String GRAPHQL_URL = "https://apis.tracker.delivery/graphql";

    /** 내부 COURIER 코드 → Delivery Tracker carrier ID */
    private static final Map<String, String> CARRIER_ID_MAP = Map.of(
        "CJ",      "kr.cjlogistics",
        "LOTTE",   "kr.lotte",
        "HANJIN",  "kr.hanjin",
        "POST",    "kr.epost",
        "LOGEN",   "kr.logen",
        "COUPANG", "kr.coupang"
    );

    private final SyPropRepository syPropRepository;
    private final Environment      environment;
    private final RestClient       restClient = RestClient.create();

    /**
     * 배송 상태 조회 (GraphQL).
     *
     * @param courierCd  내부 택배사 코드 (COURIER 그룹)
     * @param trackingNo 운송장번호
     * @return DLIV_STATUS 코드 — 키 미설정·미지원 택배사·오류 시 null
     */
    @SuppressWarnings("unchecked")
    public String getDlivStatus(String courierCd, String trackingNo) {
        String clientId = getPropValue(PROP_CLIENT_ID);
        String secret   = getPropValue(PROP_SECRET);
        if (clientId == null || clientId.isBlank() || secret == null || secret.isBlank()) {
            log.warn("[DeliveryTracker] API 키 미설정 — sy_prop({}, {}) 를 확인하세요.",
                PROP_CLIENT_ID, PROP_SECRET);
            return null;
        }

        String carrierId = CARRIER_ID_MAP.get(courierCd);
        if (carrierId == null) {
            log.warn("[DeliveryTracker] 미지원 택배사 코드: {}", courierCd);
            return null;
        }

        // GraphQL query
        String query = """
            {
              track(carrierId: "%s", trackingNumber: "%s") {
                lastEvent { status { code } }
              }
            }
            """.formatted(carrierId, trackingNo.replace("\"", ""));

        try {
            Map<String, Object> response = restClient.post()
                .uri(GRAPHQL_URL)
                .header("Authorization", "TRACKQL-API-KEY " + clientId + ":" + secret)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("query", query))
                .retrieve()
                .body(Map.class);

            if (response == null) return null;

            // 오류 체크
            Object errors = response.get("errors");
            if (errors instanceof List<?> errList && !errList.isEmpty()) {
                Map<String, Object> first = (Map<String, Object>) errList.get(0);
                log.warn("[DeliveryTracker] API 오류 — carrierId={} trackingNo={} msg={}",
                    carrierId, trackingNo, first.get("message"));
                return null;
            }

            // 응답 파싱: data.track.lastEvent.status.code
            Map<String, Object> data      = (Map<String, Object>) response.get("data");
            Map<String, Object> track     = (Map<String, Object>) data.get("track");
            Map<String, Object> lastEvent = (Map<String, Object>) track.get("lastEvent");
            Map<String, Object> status    = (Map<String, Object>) lastEvent.get("status");
            String code = String.valueOf(status.get("code"));

            return toInternalStatus(code);

        } catch (Exception e) {
            log.error("[DeliveryTracker] 조회 실패 — carrierId={} trackingNo={} error={}",
                carrierId, trackingNo, e.getMessage());
            return null;
        }
    }

    /**
     * Delivery Tracker 상태 코드 → 내부 DLIV_STATUS.
     * 표준: https://tracker.delivery/en/docs/references/status-codes
     */
    private String toInternalStatus(String code) {
        return switch (code) {
            case "INFORMATION_RECEIVED"         -> "READY";
            case "AT_PICKUP"                    -> "SHIPPED";
            case "IN_TRANSIT", "OUT_FOR_DELIVERY" -> "IN_TRANSIT";
            case "DELIVERED"                    -> "DELIVERED";
            case "ATTEMPT_FAIL", "EXCEPTION",
                 "RETURNED", "LOST"             -> "FAILED";
            default -> {
                log.debug("[DeliveryTracker] 미매핑 상태 코드: {}", code);
                yield null;
            }
        };
    }

    /** 해당 택배사를 지원하는지 여부 */
    public boolean supports(String courierCd) {
        return CARRIER_ID_MAP.containsKey(courierCd);
    }

    private String getPropValue(String propKey) {
        String profile = environment.getActiveProfiles().length > 0
            ? environment.getActiveProfiles()[0] : "-";
        return syPropRepository.findAll().stream()
            .filter(p -> "Y".equals(p.getUseYn())
                && propKey.equals(p.getPropKey())
                && isPropProfileMatch(p.getPropProfile(), profile))
            .map(SyProp::getPropValue)
            .filter(v -> v != null && !v.isBlank())
            .findFirst()
            .orElse(null);
    }

    private boolean isPropProfileMatch(String propProfile, String activeProfile) {
        if (propProfile == null || propProfile.isBlank() || "all".equals(propProfile)) return true;
        return propProfile.contains("^" + activeProfile + "^");
    }
}
