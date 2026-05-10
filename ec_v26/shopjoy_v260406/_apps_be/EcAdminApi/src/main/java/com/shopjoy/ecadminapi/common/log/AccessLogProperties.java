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

    private boolean dbSave      = true;
    private int     queueSize   = 100;
    /** "^" 구분 필터. AppType 코드(BO/FO/EXT/USER/MEMBER) 또는 특정 userId. "*"=전체 */
    private String  filter      = "*";
    /** 요청/응답 바디 최대 저장 크기(bytes). 0 = 바디 미수집 */
    private int     maxBodySize = 2000;

    private static final Set<String> TYPE_TOKENS =
            Set.of("BO", "FO", "EXT", "USER", "MEMBER");

    /** isMatch — 여부 */
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
