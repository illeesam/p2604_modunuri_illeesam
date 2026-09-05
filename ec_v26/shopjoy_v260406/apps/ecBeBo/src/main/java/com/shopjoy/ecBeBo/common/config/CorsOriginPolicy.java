package com.shopjoy.ecBeBo.common.config;

import java.util.List;

/**
 * CORS 허용 origin 패턴 목록 — SecurityConfig(시큐리티 필터 체인 단계)와 WebConfig(MVC 디스패처
 * 단계) 양쪽이 이 상수 하나를 공유한다.
 *
 * <p>2026-08-30 추가. 그전엔 두 곳에 따로 하드코딩돼 있었는데, SecurityConfig 는 이 목록으로
 * 제한(allowCredentials=true 와 '*' 조합은 브라우저가 애초에 거부하므로 patterns 로 열거)한
 * 반면 WebConfig 는 {@code allowedOriginPatterns("*")}(진짜 와일드카드)를 쓰고 있어 두 설정이
 * 서로 어긋나 있었다 — 실질적으로는 Security 필터 체인이 먼저 평가돼 그 정책이 우선 적용되는
 * 구조라 당장 뚫려있던 건 아니지만, "누가 봐도 같은 정책이어야 할 두 곳이 다르다"는 것 자체가
 * 유지보수 중 사고 요인이라 하나로 합쳤다.</p>
 */
public final class CorsOriginPolicy {

    private CorsOriginPolicy() { }

    /** 허용 origin 패턴 — 로컬 개발(localhost/127.0.0.1 전 포트) + 실제 운영 도메인. */
    public static final List<String> ALLOWED_ORIGIN_PATTERNS = List.of(
        "http://localhost:*", "https://localhost:*",
        "http://127.0.0.1:*", "https://127.0.0.1:*",
        "http://illeesam.synology.me:*", "https://illeesam.synology.me:*",
        // 2026-09-05: DSM 리버스 프록시가 서브도메인 단위로 서비스를 나누는 구성(21000.illeesam.synology.me
        // 등, 13번 문서 참조)이라 "*.illeesam.synology.me" 도 별도로 허용해야 함 — 위 "illeesam.synology.me:*"
        // 패턴은 포트만 와일드카드일 뿐 도메인 앞에 서브도메인이 붙은 origin(예: https://21000.illeesam.synology.me,
        // 포트 없음/443)은 매칭하지 않는다. 이 NAS는 앞으로도 같은 패턴(NNNNN.illeesam.synology.me)으로
        // 서브도메인을 계속 늘려갈 구성이라 서브도메인 전체를 와일드카드로 열어둔다.
        "http://*.illeesam.synology.me", "https://*.illeesam.synology.me",
        "http://illeesam.netlify.app", "https://illeesam.netlify.app"
    );
}
