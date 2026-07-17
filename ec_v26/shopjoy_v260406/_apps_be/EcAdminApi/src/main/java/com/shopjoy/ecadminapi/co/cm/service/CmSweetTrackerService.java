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

import java.util.Map;

/**
 * 스윗트래커(Sweet Tracker) 배송 조회 서비스.
 *
 * <p>API: https://info.sweettracker.co.kr/api/v1/trackingInfo
 * <p>월 1,000건 무료 (초과 시 유료). 발급: https://info.sweettracker.co.kr
 * <p>키 관리: sy_prop(app.courier.sweettracker.api-key) — BO → 시스템 → 프로퍼티 관리에서 입력
 *
 * <p>응답 level 의미:
 * <ul>
 *   <li>1 — 배송준비 (READY)</li>
 *   <li>2 — 집화완료 (SHIPPED)</li>
 *   <li>3 — 배송중   (IN_TRANSIT)</li>
 *   <li>4 — 지점도착 (IN_TRANSIT)</li>
 *   <li>5 — 배송완료 (DELIVERED)</li>
 *   <li>6 — 배송실패 (FAILED)</li>
 * </ul>
 *
 * <p>COURIER 코드 → 스윗트래커 t_code 매핑 (sy_code COURIER 그룹 기준):
 * <ul>
 *   <li>CJ     → 04 (CJ대한통운)</li>
 *   <li>LOTTE  → 08 (롯데택배)</li>
 *   <li>HANJIN → 05 (한진택배)</li>
 *   <li>POST   → 01 (우체국택배)</li>
 *   <li>LOGEN  → 06 (로젠택배)</li>
 * </ul>
 * 전체 코드표: https://info.sweettracker.co.kr/apidoc
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmSweetTrackerService {

    private static final String API_URL = "https://info.sweettracker.co.kr/api/v1/trackingInfo";
    private static final String PROP_KEY = "app.courier.sweettracker.api-key";

    /** 내부 COURIER 코드 → 스윗트래커 택배사 코드 */
    private static final Map<String, String> COURIER_CODE_MAP = Map.of(
        "CJ",     "04",
        "LOTTE",  "08",
        "HANJIN", "05",
        "POST",   "01",
        "LOGEN",  "06"
    );

    private final SyPropRepository syPropRepository;
    private final Environment      environment;
    private final RestClient       restClient = RestClient.create();

    /**
     * 배송 상태 조회.
     *
     * @param courierCd  내부 택배사 코드 (COURIER 그룹: CJ / LOTTE / HANJIN / POST / LOGEN)
     * @param trackingNo 송장번호
     * @return 조회 결과 Map — level(int), msg(String), trackingDetails(List) 등.
     *         API 키 미설정·미지원 택배사·네트워크 오류 시 null 반환.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrackingInfo(String courierCd, String trackingNo) {
        String apiKey = getPropValue(PROP_KEY);
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[SweetTracker] API 키 미설정 — sy_prop({}) 를 확인하세요.", PROP_KEY);
            return null;
        }

        String tCode = COURIER_CODE_MAP.get(courierCd);
        if (tCode == null) {
            log.warn("[SweetTracker] 미지원 택배사 코드: {}", courierCd);
            return null;
        }

        String url = UriComponentsBuilder.fromHttpUrl(API_URL)
            .queryParam("t_key",     apiKey)
            .queryParam("t_code",    tCode)
            .queryParam("t_invoice", trackingNo)
            .toUriString();

        try {
            Map<String, Object> response = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

            if (response == null) return null;

            // 오류 응답 처리 (status: false, msg 포함)
            Object status = response.get("status");
            if (Boolean.FALSE.equals(status) || "false".equals(String.valueOf(status))) {
                log.warn("[SweetTracker] API 오류 — courierCd={} trackingNo={} msg={}",
                    courierCd, trackingNo, response.get("msg"));
                return null;
            }

            return response;

        } catch (Exception e) {
            log.error("[SweetTracker] 조회 실패 — courierCd={} trackingNo={} error={}",
                courierCd, trackingNo, e.getMessage());
            return null;
        }
    }

    /**
     * level 값을 내부 DLIV_STATUS 코드로 변환.
     *
     * @return READY / SHIPPED / IN_TRANSIT / DELIVERED / FAILED / null(미조회)
     */
    public String levelToDlivStatus(int level) {
        return switch (level) {
            case 1    -> "READY";
            case 2    -> "SHIPPED";
            case 3, 4 -> "IN_TRANSIT";
            case 5    -> "DELIVERED";
            case 6    -> "FAILED";
            default   -> null;
        };
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
