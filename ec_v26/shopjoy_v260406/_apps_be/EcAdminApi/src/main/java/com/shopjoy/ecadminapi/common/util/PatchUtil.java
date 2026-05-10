package com.shopjoy.ecadminapi.common.util;

import java.util.Map;

/**
 * PATCH 요청 처리 유틸.
 *
 * PATCH는 전달된 필드만 수정하고 나머지는 기존 값을 유지해야 한다.
 * null 값은 "변경하지 않음"으로 간주하여 기존 값을 덮어쓰지 않는다.
 * (null로 명시적 초기화가 필요한 경우 별도 처리 필요)
 */
public class PatchUtil {

    private PatchUtil() {}

    /**
     * patch 맵의 non-null 값만 existing 맵에 병합한다.
     *
     * @param existing 기존 데이터 맵 (DB에서 조회한 원본)
     * @param patch    클라이언트가 전송한 변경 필드 맵
     * @return 병합된 existing 맵 (원본 수정 후 반환)
     */
    public static Map<String, Object> applyPatch(Map<String, Object> existing, Map<String, Object> patch) {
        for (Map.Entry<String, Object> entry : patch.entrySet()) {
            if (entry.getValue() != null) {
                existing.put(entry.getKey(), entry.getValue());
            }
        }
        return existing;
    }
}
