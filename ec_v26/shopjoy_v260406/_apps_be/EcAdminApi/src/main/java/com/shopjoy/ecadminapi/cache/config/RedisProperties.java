package com.shopjoy.ecadminapi.cache.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * app.redis.* 설정.
 *
 * enabled: false(기본) → Redis 미사용. RedisUtil 모든 연산이 no-op.
 * primary : 항상 사용하는 메인 Redis 노드.
 * secondary: 선택적 보조 Redis 노드. app.redis.secondary.host 미설정 시 primary 로 fallback.
 *
 * TTL 기본값:
 *   auth           : 900s  (JWT access-expiry 와 맞춤)
 *   sy-code        : 3600s (시스템 공통코드)
 *   sy-menu        : 3600s (메뉴 구조)
 *   sy-role        : 3600s (역할 정보)
 *   sy-role-menu   : 3600s (역할-메뉴 매핑)
 *   sy-prop        : 3600s (시스템 프로퍼티)
 *   sy-i18n        : 3600s (다국어 메시지)
 *   ec-pd-prod      : 3600s (상품 정보)
 *   ec-pm-prom      : 3600s (프로모션 정보)
 *   ec-pm-prom-item : 3600s (프로모션 항목 정보)
 *   ec-dp-disp      : 3600s (전시 정보)
 *   ec-dp-disp-item : 3600s (전시 항목 정보)
 */
@Component
@ConfigurationProperties(prefix = "app.redis")
@Getter @Setter
public class RedisProperties {

    private boolean enabled = false;

    private Node    primary   = new Node();
    private Node    secondary = new Node();   // host 가 비어있으면 secondary 미사용

    private Ttl     ttl       = new Ttl();

    @Getter @Setter
    public static class Node {
        private String host     = "";
        private int    port     = 6379;
        private String password = "";
        private int    database = 0;
        private int    timeout  = 3000;   // 연결 타임아웃 (ms)
    }

    @Getter @Setter
    public static class Ttl {
        // ── auth: JWT access-expiry(900s)와 동일하게 맞춤 ─────────
        private long boAuthSeconds     = 900;    // BO 관리자 세션  | 15분
        private long foAuthSeconds     = 900;    // FO 회원 세션    | 15분
        private long extAuthSeconds    = 900;    // EXT 외부 세션   | 15분

        // ── sy-*: 변경 빈도 낮음. 실시간 반영은 evict()로 처리하므로
        //          TTL은 안전망 역할만 함 → 길게 잡아도 무방 ─────────
        private long syCodeSeconds     = 3600;   // 공통코드        | 1시간
        private long syMenuSeconds     = 3600;   // 메뉴 구조       | 1시간
        private long syRoleSeconds     = 3600;   // 역할 정보       | 1시간
        private long syRoleMenuSeconds = 3600;   // 역할-메뉴 매핑  | 1시간
        private long syPropSeconds     = 3600;   // 시스템 프로퍼티 | 1시간
        private long syI18nSeconds     = 3600;   // 다국어 메시지   | 1시간

        // ── ec-*: 상품·프로모션·전시도 변경 시 evict() 호출 전제.
        //          3600으로 올려도 무방 ─────────────────────────────
        private long ecPdProdSeconds     = 3600;   // 상품 정보           | 1시간
        private long ecPdCateSeconds     = 3600;   // 카테고리 정보       | 1시간
        private long ecPdCateProdSeconds = 3600;   // 카테고리 상품 정보  | 1시간
        private long ecPmPromSeconds     = 3600;   // 프로모션 정보       | 1시간
        private long ecPmPromItemSeconds = 3600;   // 프로모션 항목 정보  | 1시간
        private long ecDpDispSeconds     = 3600;   // 전시 정보           | 1시간
        private long ecDpDispItemSeconds = 3600;   // 전시 항목 정보      | 1시간
    }

    /** secondary.host 가 설정되어 있는지 */
    public boolean hasSecondary() {
        return secondary != null
                && secondary.getHost() != null
                && !secondary.getHost().isBlank();
    }
}
