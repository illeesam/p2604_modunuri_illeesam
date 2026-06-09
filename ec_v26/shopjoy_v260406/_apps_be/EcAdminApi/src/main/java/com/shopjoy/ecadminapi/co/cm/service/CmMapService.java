package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.co.cm.data.vo.MapKeysRes;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 지도(맵) 키 발급 서비스 (BO/FO 공통, co 레이어).
 *
 * <p>카카오맵 / 네이버맵 JavaScript SDK 초기화용 공개키만 반환한다.
 * 공개키는 브라우저에 노출되어도 무방한 클라이언트 키(JS 키 / Client ID)로,
 * 도메인 허용(referer) 제한으로 보호되는 키다. 시크릿/REST 키는 절대 반환하지 않는다.</p>
 *
 * <p>키 출처: application.yml 의 map.kakao-js-key / map.naver-map-client-id
 * (환경변수 KAKAO_MAP_JS_KEY / NAVER_MAP_CLIENT_ID 로 주입 권장).
 * CmTossPayService 의 client-key 조회 패턴을 그대로 따른다. 미설정 시 빈 문자열로
 * 반환하여(에러 없이) 프론트가 폴백/안내를 처리할 수 있게 한다.</p>
 *
 * <p>appTypeCd("BO"|"FO") 는 호출자(컨트롤러)가 전달한다. 현재 동일 키를 반환하나,
 * 향후 사이트별/콘솔별 키 분기 여지를 위해 시그니처에 유지한다.</p>
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class CmMapService {

    /** 카카오맵 JavaScript 키 (공개키). 프론트 SDK 로드 시 사용. */
    private final String kakaoMapJsKey;

    /** 네이버 클라우드 맵 Client ID (공개키). 프론트 SDK 로드 시 사용. */
    private final String naverMapClientId;

    public CmMapService(
            @Value("${map.kakao-js-key:}") String kakaoMapJsKey,
            @Value("${map.naver-map-client-id:}") String naverMapClientId) {
        this.kakaoMapJsKey    = kakaoMapJsKey;
        this.naverMapClientId = naverMapClientId;
    }

    /**
     * 카카오맵 / 네이버맵 JS 공개키를 반환한다.
     *
     * @param appTypeCd "BO" 또는 "FO" (현재 동일 키 반환, 향후 사이트별 분기 여지)
     * @return MapKeysRes (kakaoMapJsKey / naverMapClientId). 미설정 키는 빈 문자열.
     */
    public MapKeysRes getMapKeys(String appTypeCd) {
        if (kakaoMapJsKey == null || kakaoMapJsKey.isBlank()) {
            log.warn("카카오맵 JS 키 미설정 — application.yml 의 map.kakao-js-key (또는 환경변수 KAKAO_MAP_JS_KEY) 확인 필요. appTypeCd={}", appTypeCd);
        }
        if (naverMapClientId == null || naverMapClientId.isBlank()) {
            log.warn("네이버맵 Client ID 미설정 — application.yml 의 map.naver-map-client-id (또는 환경변수 NAVER_MAP_CLIENT_ID) 확인 필요. appTypeCd={}", appTypeCd);
        }

        return MapKeysRes.builder()
                .kakaoMapJsKey(kakaoMapJsKey != null ? kakaoMapJsKey : "")
                .naverMapClientId(naverMapClientId != null ? naverMapClientId : "")
                .build();
    }
}
