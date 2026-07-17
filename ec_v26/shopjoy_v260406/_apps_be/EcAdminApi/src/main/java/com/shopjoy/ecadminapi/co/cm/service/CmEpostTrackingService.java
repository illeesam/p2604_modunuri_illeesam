package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * 우체국(우정사업본부) 배송조회 오픈API 서비스.
 *
 * <p>공공데이터포털 무료 API — 일 10,000건 (기본) / 운영계정 증량 가능
 * <p>발급: https://www.data.go.kr/data/15035122/openapi.do → 활용신청 → serviceKey 발급
 * <p>키 관리: sy_prop(app.courier.epost.service-key) — BO → 시스템 → 프로퍼티 관리에서 입력
 *
 * <p>지원 우편물 유형:
 * <ul>
 *   <li>국내 통합 (소포·등기·일반택배 등) — 기본 사용</li>
 *   <li>EMS — {@code trackEms()} 사용</li>
 * </ul>
 *
 * <p>응답 처리현황(dlvyDetailDe) → 내부 DLIV_STATUS 변환:
 * <ul>
 *   <li>접수          → SHIPPED</li>
 *   <li>발송·이동     → IN_TRANSIT</li>
 *   <li>배달준비·배달중 → IN_TRANSIT</li>
 *   <li>배달완료      → DELIVERED</li>
 *   <li>반송·미배달   → FAILED</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmEpostTrackingService {

    private static final String PROP_KEY = "app.courier.epost.service-key";

    // 공공데이터포털 우체국 종적 조회 통합 엔드포인트
    private static final String DOMESTIC_URL =
        "http://openapi.epost.go.kr/trace/retrieveLongitudinalCombinedService" +
        "/retrieveLongitudinalCombinedService/getLongitudinalCombinedList";

    private static final String EMS_URL =
        "http://openapi.epost.go.kr/trace/retrieveLongitudinalEMSService" +
        "/retrieveLongitudinalEMSService/getLongitudinalEMSList";

    private final SyPropRepository syPropRepository;
    private final Environment      environment;
    private final RestClient       restClient = RestClient.create();

    /**
     * 국내 우편물(소포·등기·택배) 배송 상태 조회.
     *
     * @param trackingNo 송장번호(등기번호)
     * @return 현재 배송상태 (DLIV_STATUS 코드) — 조회 실패 또는 키 미설정 시 null
     */
    public String getDlivStatus(String trackingNo) {
        String serviceKey = getPropValue(PROP_KEY);
        if (serviceKey == null || serviceKey.isBlank()) {
            log.warn("[EpostTracking] API 키 미설정 — sy_prop({}) 를 확인하세요.", PROP_KEY);
            return null;
        }

        String url = UriComponentsBuilder.fromHttpUrl(DOMESTIC_URL)
            .queryParam("serviceKey",  serviceKey)
            .queryParam("rgist",       trackingNo)
            .queryParam("_type",       "json")
            .toUriString();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

            return parseStatus(body, trackingNo);

        } catch (Exception e) {
            log.error("[EpostTracking] 조회 실패 — trackingNo={} error={}", trackingNo, e.getMessage());
            return null;
        }
    }

    /**
     * EMS(국제특급우편) 배송 상태 조회.
     *
     * @param trackingNo EMS 운송장 번호
     * @return 현재 배송상태 (DLIV_STATUS 코드) — 조회 실패 시 null
     */
    public String getEmsDlivStatus(String trackingNo) {
        String serviceKey = getPropValue(PROP_KEY);
        if (serviceKey == null || serviceKey.isBlank()) {
            log.warn("[EpostTracking] API 키 미설정 — sy_prop({}) 를 확인하세요.", PROP_KEY);
            return null;
        }

        String url = UriComponentsBuilder.fromHttpUrl(EMS_URL)
            .queryParam("serviceKey",  serviceKey)
            .queryParam("rgist",       trackingNo)
            .queryParam("_type",       "json")
            .toUriString();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

            return parseStatus(body, trackingNo);

        } catch (Exception e) {
            log.error("[EpostTracking] EMS 조회 실패 — trackingNo={} error={}", trackingNo, e.getMessage());
            return null;
        }
    }

    // ── 응답 파싱 ─────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String parseStatus(Map<String, Object> body, String trackingNo) {
        if (body == null) return null;

        // 응답 구조: response.body.items.item[]
        try {
            Map<String, Object> response = (Map<String, Object>) body.get("response");
            Map<String, Object> resBody  = (Map<String, Object>) response.get("body");
            Object totalCount = resBody.get("totalCount");

            if (totalCount == null || "0".equals(String.valueOf(totalCount))) {
                log.debug("[EpostTracking] 조회 결과 없음 — trackingNo={}", trackingNo);
                return null;
            }

            Map<String, Object> items = (Map<String, Object>) resBody.get("items");
            Object item = items.get("item");

            // 단건이면 Map, 다건이면 List — 마지막(최신) 이력이 현재 상태
            String latestStatus = null;
            if (item instanceof List<?> list && !list.isEmpty()) {
                Map<String, Object> last = (Map<String, Object>) list.get(list.size() - 1);
                latestStatus = String.valueOf(last.getOrDefault("dlvyDetailDe", ""));
            } else if (item instanceof Map<?, ?> single) {
                latestStatus = String.valueOf(((Map<String, Object>) single).getOrDefault("dlvyDetailDe", ""));
            }

            return toDlivStatus(latestStatus);

        } catch (Exception e) {
            log.warn("[EpostTracking] 응답 파싱 실패 — trackingNo={} error={}", trackingNo, e.getMessage());
            return null;
        }
    }

    /**
     * 처리현황(dlvyDetailDe) 텍스트 → 내부 DLIV_STATUS 코드.
     * 우체국 API 처리현황 예시: 접수, 발송, 도착, 배달준비, 배달중, 배달완료, 반송, 미배달
     */
    private String toDlivStatus(String detail) {
        if (detail == null || detail.isBlank()) return null;

        if (detail.contains("접수"))              return "SHIPPED";
        if (detail.contains("발송") || detail.contains("이동") || detail.contains("도착"))
                                                  return "IN_TRANSIT";
        if (detail.contains("배달준비") || detail.contains("배달중"))
                                                  return "IN_TRANSIT";
        if (detail.contains("배달완료"))           return "DELIVERED";
        if (detail.contains("반송") || detail.contains("미배달"))
                                                  return "FAILED";

        log.debug("[EpostTracking] 미매핑 처리현황: {}", detail);
        return null;
    }

    // ── sy_prop 키 조회 ───────────────────────────────────────────────────

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
