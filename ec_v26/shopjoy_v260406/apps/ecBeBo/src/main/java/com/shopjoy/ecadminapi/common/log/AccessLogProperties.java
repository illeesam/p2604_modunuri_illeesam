package com.shopjoy.ecadminapi.common.log;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Set;

/**
 * app.access-log.* 설정.
 *
 * filter: "^" 구분 토큰 목록.
 *   - "*"                → 전체 기록
 *   - "BO^FO^EXT"       → 해당 AppType 전체 기록
 *   - "admin01^BO"      → 특정 userId 또는 AppType 매칭
 *   - 비어있거나 null   → 전체 기록
 */
@Getter @Setter
@ConfigurationProperties(prefix = "app.access-log")
public class AccessLogProperties {

    /** DB 저장 활성화 여부 (false 면 로그를 큐에 적재하지 않음) */
    private boolean dbSave      = true;
    /** 비동기 큐 최대 크기. 포화 시 신규 로그는 드롭됨 */
    private int     queueSize   = 100;
    /** "^" 구분 필터. AppType 코드(BO/FO/EXT/USER/MEMBER) 또는 특정 userId. "*"=전체 */
    private String  filter      = "*";
    /** 요청/응답 바디 최대 저장 크기(bytes). 0 = 바디 미수집 */
    private int     maxBodySize = 2000;

    /** filter 토큰이 AppType 코드인지 userId 인지 구분하기 위한 AppType 코드 집합 */
    private static final Set<String> TYPE_TOKENS =
            Set.of("BO", "FO", "EXT", "USER", "MEMBER");

    /**
     * 현재 요청을 액세스 로그 기록 대상으로 볼지 판별한다.
     *
     * <p>filter 가 비어있거나 "*" 이면 전체 기록. 그 외에는 "^" 로 분리한 각 토큰을
     * 검사하여, 토큰이 AppType 코드 집합에 속하면 AppType 과(대소문자 무시),
     * 아니면 userId 와(정확히) 일치하는지 본다. 하나라도 일치하면 기록 대상이다.
     *
     * @param AppType 현재 요청의 앱 타입 코드 (BO/FO/EXT/USER/MEMBER 등)
     * @param userId  현재 요청의 사용자 ID
     * @return 기록 대상이면 true
     */
    public boolean isMatch(String AppType, String userId) {
        if (filter == null || filter.isBlank() || "*".equals(filter.trim())) return true;
        for (String token : filter.split("\\^")) {
            String t = token.trim();
            if (t.isEmpty()) continue;
            if (TYPE_TOKENS.contains(t.toUpperCase())) {
                if (t.equalsIgnoreCase(AppType)) return true;
            } else {
                if (t.equals(userId)) return true;
            }
        }
        return false;
    }
}
