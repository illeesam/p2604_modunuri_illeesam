package com.shopjoy.ecadminapi.common.util;

import java.util.Map;

/**
 * PATCH 요청 처리 유틸.
 *
 * PATCH는 전달된 필드만 수정하고 나머지는 기존 값을 유지해야 한다.
 * null 값은 "변경하지 않음"으로 간주하여 기존 값을 덮어쓰지 않는다.
 * (null로 명시적 초기화가 필요한 경우 별도 처리 필요)
 *
 * <p>주의사항: 인스턴스화 불가. existing 맵을 in-place 로 변경 후 그대로 반환한다.
 */
public class PatchUtil {

    /** 유틸 클래스 — 인스턴스화 금지. */
    private PatchUtil() {}

    /**
     * patch 맵의 non-null 값만 existing 맵에 병합한다.
     *
     * <p>patch 의 null 값은 "변경 안 함"으로 보고 건너뛴다(기존 값 유지).
     * existing 객체를 직접 수정하므로 호출 측에서 동일 참조가 그대로 반영됨에 유의.
     * (existing/patch 가 null 이면 NPE — 호출 전 non-null 보장 필요)
     *
     * @param existing 기존 데이터 맵 (DB에서 조회한 원본, in-place 변경됨)
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
