package com.shopjoy.ecadminapi.cache.service;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Redis 캐시 조회 서비스 (읽기 전용).
 * CacheRedisInfoController 의 비즈니스 로직 담당.
 *
 * ── 주요 기능 ──────────────────────────────────────────────────────
 * isEnabled()          Redis 활성 여부 확인
 * getStatus()          도메인별 지원 방식 맵 반환 (reload / evict-only)
 * getInfo()            도메인별 캐시 상태 (cached, keyCount, remainTtlSec, elapsedSec, updatedAt)
 * getCacheAll(domain)  도메인 전체 캐시값 조회
 * getCacheByKey(d, k)  서브키 단건 캐시값 조회
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CacheRedisInfoService {

    private final RedisUtil        redis;
    private final RedisProperties  redisProps;

    private static final DateTimeFormatter DT_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    // ════════════════════════════════════════════════════════════
    //  활성 여부
    // ════════════════════════════════════════════════════════════

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    // ════════════════════════════════════════════════════════════
    //  상태 조회
    // ════════════════════════════════════════════════════════════

    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", redis.isEnabled());
        if (!redis.isEnabled()) return status;

        // reload: evict 후 DB 즉시 재적재 / evict-only: 키 삭제만 → 다음 요청 시 lazy 재적재
        Map<String, String> domains = new LinkedHashMap<>();
        domains.put("sy-code",          "reload");      // 공통코드         | 건수 소 → 즉시 재적재
        domains.put("sy-menu",          "reload");      // 메뉴 구조        | 건수 소 → 즉시 재적재
        domains.put("sy-role",          "reload");      // 역할 정보        | 건수 소 → 즉시 재적재
        domains.put("sy-role-menu",     "reload");      // 역할-메뉴 매핑   | 건수 소 → 즉시 재적재
        domains.put("sy-prop",          "reload");      // 시스템 프로퍼티  | 건수 소 → 즉시 재적재
        domains.put("sy-i18n",          "reload");      // 다국어 메시지    | 건수 소 → 즉시 재적재
        domains.put("ec-pd-cate",       "reload");      // 카테고리         | 건수 소 → 즉시 재적재
        domains.put("ec-pd-prod",       "evict-only");  // 상품             | siteId별 다수 → lazy 재적재
        domains.put("ec-pd-cate-prod",  "evict-only");  // 카테고리-상품    | siteId별 다수 → lazy 재적재
        domains.put("ec-pm-prom",       "evict-only");  // 프로모션         | siteId별 다수 → lazy 재적재
        domains.put("ec-pm-prom-item",  "evict-only");  // 프로모션 항목    | siteId별 다수 → lazy 재적재
        domains.put("ec-dp-disp",       "evict-only");  // 전시             | siteId별 다수 → lazy 재적재
        domains.put("ec-dp-disp-item",  "evict-only");  // 전시 항목        | siteId별 다수 → lazy 재적재
        status.put("domains", domains);
        return status;
    }

    // ════════════════════════════════════════════════════════════
    //  캐시 정보 조회
    // ════════════════════════════════════════════════════════════

    /**
     * 도메인별 캐시 상태 반환.
     * - cached: 키 존재 여부
     * - remainTtlSec: 남은 TTL(초). -1=만료없음, -2=키없음/오류
     * - elapsedSec: configTTL - remainTTL (저장 후 경과 초)
     * - updatedAt: 대략적인 갱신 시각 (now - elapsedSec)
     * - keyCount: 패턴 매칭 키 수
     */
    public List<Map<String, Object>> getInfo() {
        RedisUtil.Target pri = RedisUtil.Target.PRIMARY;
        RedisUtil.Target sec = RedisUtil.Target.SECONDARY;
        RedisProperties.Ttl ttl = redisProps.getTtl();

        return List.of(
            domainInfo("sy-code",         CacheKey.SY_CODE_ALL,               ttl.getSyCodeSeconds(),        pri, CacheKey.SY_CODE_GRP        + "*"),
            domainInfo("sy-menu",         CacheKey.SY_MENU_ALL,               ttl.getSyMenuSeconds(),        pri, CacheKey.SY_MENU_ROLE        + "*"),
            domainInfo("sy-role",         CacheKey.SY_ROLE_ALL,               ttl.getSyRoleSeconds(),        pri, CacheKey.SY_ROLE_DTL         + "*"),
            domainInfo("sy-role-menu",    CacheKey.SY_ROLE_MENU + "*",        ttl.getSyRoleMenuSeconds(),    pri, null),
            domainInfo("sy-prop",         CacheKey.SY_PROP_ALL,               ttl.getSyPropSeconds(),        pri, CacheKey.SY_PROP_KEY         + "*"),
            domainInfo("sy-i18n",         CacheKey.SY_I18N_ALL,               ttl.getSyI18nSeconds(),        pri, CacheKey.SY_I18N_MSG         + "*"),
            domainInfo("ec-pd-prod",      CacheKey.EC_PD_PROD_ALL      + "*", ttl.getEcPdProdSeconds(),      sec, null),
            domainInfo("ec-pd-cate",      CacheKey.EC_PD_CATE_ALL,            ttl.getEcPdCateSeconds(),      sec, CacheKey.EC_PD_CATE_DTL      + "*"),
            domainInfo("ec-pd-cate-prod", CacheKey.EC_PD_CATE_PROD_ALL + "*", ttl.getEcPdCateProdSeconds(),  sec, null),
            domainInfo("ec-pm-prom",      CacheKey.EC_PM_PROM_ALL      + "*", ttl.getEcPmPromSeconds(),      sec, null),
            domainInfo("ec-pm-prom-item", CacheKey.EC_PM_PROM_ITEM_ALL + "*", ttl.getEcPmPromItemSeconds(),  sec, null),
            domainInfo("ec-dp-disp",      CacheKey.EC_DP_DISP_ALL      + "*", ttl.getEcDpDispSeconds(),      sec, null),
            domainInfo("ec-dp-disp-item", CacheKey.EC_DP_DISP_ITEM_ALL + "*", ttl.getEcDpDispItemSeconds(),  sec, null)
        );
    }

    /** domainInfo */
    private Map<String, Object> domainInfo(String domain, String repKey, long configTtl,
                                            RedisUtil.Target target, String countPattern) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("domain", domain);

        boolean isPattern = repKey.endsWith("*");
        long remainTtl;
        long keyCount;

        if (isPattern) {
            keyCount  = redis.countKeys(repKey, target);
            remainTtl = keyCount > 0 ? -1L : -2L; // 패턴키는 TTL 개별 조회 생략
        } else {
            remainTtl = redis.getTtl(repKey, target);
            keyCount  = redis.exists(repKey, target) ? 1L : 0L;
            if (countPattern != null) keyCount += redis.countKeys(countPattern, target);
        }

        boolean cached     = keyCount > 0;
        long    elapsedSec = (cached && remainTtl > 0 && configTtl > 0)
                             ? configTtl - remainTtl : -1;

        info.put("cached",       cached);
        info.put("keyCount",     keyCount);
        info.put("configTtlSec", configTtl);
        info.put("remainTtlSec", remainTtl);
        info.put("elapsedSec",   elapsedSec);   // configTTL - remainTTL = 저장 후 경과 초

        if (elapsedSec >= 0) {
            long updatedEpoch = Instant.now().getEpochSecond() - elapsedSec;
            info.put("updatedAt", DT_FMT.format(Instant.ofEpochSecond(updatedEpoch)));
        } else {
            info.put("updatedAt", null);
        }
        return info;
    }

    // ════════════════════════════════════════════════════════════
    //  캐시값 조회
    // ════════════════════════════════════════════════════════════

    /**
     * 도메인 전체 캐시값 반환.
     *   sy-code        → Map<codeGrp, List<Map>>
     *   sy-menu        → List<Map> (전체 메뉴)
     *   sy-role        → List<Map> (전체 역할)
     *   sy-prop        → Map<propKey, propValue>
     *   sy-i18n        → Map<langCd, Map<i18nId, msg>>
     *   ec-pd-cate     → List<Map> (전체 카테고리)
     *   그 외           → null (단건/siteId 기준 키라 전체 조회 불가 → subKey 필요)
     */
    public Object getCacheAll(String domain) {
        if (!redis.isEnabled()) return null;
        return switch (domain) {
            case "sy-code"     -> redis.get(CacheKey.SY_CODE_ALL,    Object.class).orElse(null);
            case "sy-menu"     -> redis.get(CacheKey.SY_MENU_ALL,    Object.class).orElse(null);
            case "sy-role"     -> redis.get(CacheKey.SY_ROLE_ALL,    Object.class).orElse(null);
            case "sy-prop"     -> redis.get(CacheKey.SY_PROP_ALL,    Object.class).orElse(null);
            case "sy-i18n"     -> redis.get(CacheKey.SY_I18N_ALL,    Object.class).orElse(null);
            case "ec-pd-cate"  -> redis.get(CacheKey.EC_PD_CATE_ALL, Object.class, RedisUtil.Target.SECONDARY).orElse(null);
            default            -> null;
        };
    }

    /**
     * 도메인 + 서브키로 특정 캐시값 반환.
     *   sy-code/{grp}           → List<Map> (그룹 코드 목록)
     *   sy-menu/{roleId}        → List<Map> (역할별 메뉴)
     *   sy-role/{roleId}        → Map       (역할 상세)
     *   sy-role-menu/{roleId}   → List<String> (허용 menuId 목록)
     *   sy-prop/{key}           → String    (프로퍼티 값)
     *   sy-i18n/{langCd}:{key}  → String    (메시지 값)
     *   ec-pd-prod/{prodId}     → Map       (상품 상세)
     *   ec-pd-cate/{cateId}     → Map       (카테고리 상세)
     *   ec-pd-cate-prod/{cateId}→ List<Map> (카테고리 상품 목록)
     *   ec-pm-prom/{promId}     → Map       (프로모션 상세)
     *   ec-pm-prom-item/{promId}→ List<Map> (프로모션 항목 목록)
     *   ec-dp-disp/{dispId}     → Map       (전시 상세)
     *   ec-dp-disp-item/{dispId}→ List<Map> (전시 항목 목록)
     */
    public Object getCacheByKey(String domain, String subKey) {
        if (!redis.isEnabled()) return null;
        RedisUtil.Target sec = RedisUtil.Target.SECONDARY;
        String redisKey = switch (domain) {
            case "sy-code"         -> CacheKey.SY_CODE_GRP        + subKey;
            case "sy-menu"         -> CacheKey.SY_MENU_ROLE        + subKey;
            case "sy-role"         -> CacheKey.SY_ROLE_DTL         + subKey;
            case "sy-role-menu"    -> CacheKey.SY_ROLE_MENU        + subKey;
            case "sy-prop"         -> CacheKey.SY_PROP_KEY         + subKey;
            case "sy-i18n"         -> CacheKey.SY_I18N_MSG         + subKey; // 형식: {langCd}:{msgKey}
            case "ec-pd-prod"      -> CacheKey.EC_PD_PROD_DTL      + subKey;
            case "ec-pd-cate"      -> CacheKey.EC_PD_CATE_DTL      + subKey;
            case "ec-pd-cate-prod" -> CacheKey.EC_PD_CATE_PROD_ALL + subKey;
            case "ec-pm-prom"      -> CacheKey.EC_PM_PROM_DTL      + subKey;
            case "ec-pm-prom-item" -> CacheKey.EC_PM_PROM_ITEM_ALL + subKey;
            case "ec-dp-disp"      -> CacheKey.EC_DP_DISP_DTL      + subKey;
            case "ec-dp-disp-item" -> CacheKey.EC_DP_DISP_ITEM_ALL + subKey;
            default                -> null;
        };
        if (redisKey == null) return null;
        RedisUtil.Target target = domain.startsWith("ec-") ? sec : RedisUtil.Target.PRIMARY;
        return redis.get(redisKey, Object.class, target).orElse(null);
    }
}
