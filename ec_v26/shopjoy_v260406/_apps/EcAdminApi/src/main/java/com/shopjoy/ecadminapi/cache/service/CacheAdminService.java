package com.shopjoy.ecadminapi.cache.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryMapper;
import com.shopjoy.ecadminapi.base.sy.mapper.*;
import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import com.shopjoy.ecadminapi.cache.store.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 캐시 관리 서비스.
 * evict(삭제) + reload(DB 재조회 후 저장) 두 단계로 동작.
 * Redis 비활성 시 모든 메서드는 no-op 처리된다.
 */
@Service
@RequiredArgsConstructor
public class CacheAdminService {

    // ── SY CacheStore ─────────────────────────────────────────────
    private final SyCodeCacheStore     codeCache;
    private final SyMenuCacheStore     menuCache;
    private final SyRoleCacheStore     roleCache;
    private final SyRoleMenuCacheStore roleMenuCache;
    private final SyPropCacheStore     propCache;
    private final SyI18nCacheStore     i18nCache;

    // ── EC CacheStore ─────────────────────────────────────────────
    private final EcPdProdCacheStore      ecPdProdCache;
    private final EcPdCateCacheStore      ecPdCateCache;
    private final EcPdCateProdCacheStore  ecPdCateProdCache;
    private final EcPmPromCacheStore      ecPmPromCache;
    private final EcPmPromItemCacheStore  ecPmPromItemCache;
    private final EcDpDispCacheStore      ecDpDispCache;
    private final EcDpDispItemCacheStore  ecDpDispItemCache;

    // ── SY Mapper (DB 재조회) ─────────────────────────────────────
    private final SyCodeMapper         codeMapper;
    private final SyMenuMapper         menuMapper;
    private final SyRoleMapper         roleMapper;
    private final SyRoleMenuMapper     roleMenuMapper;
    private final SyPropMapper         propMapper;
    private final SyI18nMsgMapper      i18nMsgMapper;

    // ── EC Mapper (DB 재조회 — 카테고리만 full reload 지원) ────────
    private final PdCategoryMapper     categoryMapper;

    private final RedisUtil        redis;
    private final RedisProperties  redisProps;
    private final ObjectMapper     objectMapper;

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

        // reload: DB 재조회 지원 / evict-only: 삭제만 지원 (lazy 재적재)
        Map<String, String> domains = new LinkedHashMap<>();
        domains.put("sy-code",          "reload");
        domains.put("sy-menu",          "reload");
        domains.put("sy-role",          "reload");
        domains.put("sy-role-menu",     "reload");
        domains.put("sy-prop",          "reload");
        domains.put("sy-i18n",          "reload");
        domains.put("ec-pd-cate",       "reload");
        domains.put("ec-pd-prod",       "evict-only");
        domains.put("ec-pd-cate-prod",  "evict-only");
        domains.put("ec-pm-prom",       "evict-only");
        domains.put("ec-pm-prom-item",  "evict-only");
        domains.put("ec-dp-disp",       "evict-only");
        domains.put("ec-dp-disp-item",  "evict-only");
        status.put("domains", domains);
        return status;
    }

    // ════════════════════════════════════════════════════════════
    //  전체 재조회
    // ════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, Integer> reloadAll() {
        Map<String, Integer> result = new LinkedHashMap<>();
        // SY: full reload
        result.put("sy-code",      reloadCode());
        result.put("sy-menu",      reloadMenu());
        result.put("sy-role",      reloadRole());
        result.put("sy-role-menu", reloadRoleMenu());
        result.put("sy-prop",      reloadProp());
        result.put("sy-i18n",      reloadI18n());
        // EC: 카테고리만 reload, 나머지는 evict(lazy 재적재)
        result.put("ec-pd-cate",      reloadEcPdCate());
        result.put("ec-pd-prod",      evictAndReturn("ec-pd-prod"));
        result.put("ec-pd-cate-prod", evictAndReturn("ec-pd-cate-prod"));
        result.put("ec-pm-prom",      evictAndReturn("ec-pm-prom"));
        result.put("ec-pm-prom-item", evictAndReturn("ec-pm-prom-item"));
        result.put("ec-dp-disp",      evictAndReturn("ec-dp-disp"));
        result.put("ec-dp-disp-item", evictAndReturn("ec-dp-disp-item"));
        return result;
    }

    // ════════════════════════════════════════════════════════════
    //  도메인별 재조회
    // ════════════════════════════════════════════════════════════

    /** sy-code: codeGrp 기준으로 그룹핑하여 저장 */
    @Transactional(readOnly = true)
    public int reloadCode() {
        if (!redis.isEnabled()) return 0;
        codeCache.evictAll();
        var list = codeMapper.selectList(Map.of());
        Map<String, List<Map<String, Object>>> grouped = list.stream()
            .collect(Collectors.groupingBy(
                dto -> dto.getCodeGrp(),
                LinkedHashMap::new,
                Collectors.mapping(dto -> toMap(dto), Collectors.toList())
            ));
        codeCache.saveAll(grouped);
        return list.size();
    }

    /** sy-menu: 전체 목록 저장 */
    @Transactional(readOnly = true)
    public int reloadMenu() {
        if (!redis.isEnabled()) return 0;
        menuCache.evictAll();
        var list = menuMapper.selectList(Map.of());
        menuCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        return list.size();
    }

    /** sy-role: 전체 목록 저장 */
    @Transactional(readOnly = true)
    public int reloadRole() {
        if (!redis.isEnabled()) return 0;
        roleCache.evictAll();
        var list = roleMapper.selectList(Map.of());
        roleCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        return list.size();
    }

    /** sy-role-menu: roleId 기준으로 그룹핑하여 menuId 목록 저장 */
    @Transactional(readOnly = true)
    public int reloadRoleMenu() {
        if (!redis.isEnabled()) return 0;
        roleMenuCache.evictAll();
        var list = roleMenuMapper.selectList(Map.of());
        list.stream()
            .collect(Collectors.groupingBy(
                dto -> dto.getRoleId(),
                Collectors.mapping(dto -> dto.getMenuId(), Collectors.toList())
            ))
            .forEach(roleMenuCache::save);
        return list.size();
    }

    /** sy-prop: propKey → propValue 맵으로 저장 */
    @Transactional(readOnly = true)
    public int reloadProp() {
        if (!redis.isEnabled()) return 0;
        propCache.evictAll();
        var list = propMapper.selectList(Map.of());
        Map<String, String> propMap = list.stream()
            .filter(dto -> dto.getPropKey() != null)
            .collect(Collectors.toMap(
                dto -> dto.getPropKey(),
                dto -> dto.getPropValue() != null ? dto.getPropValue() : "",
                (a, b) -> b,
                LinkedHashMap::new
            ));
        propCache.saveAll(propMap);
        return list.size();
    }

    /** sy-i18n: langCd → (i18nId → i18nMsg) 중첩 맵으로 저장 */
    @Transactional(readOnly = true)
    public int reloadI18n() {
        if (!redis.isEnabled()) return 0;
        i18nCache.evictAll();
        var list = i18nMsgMapper.selectList(Map.of());
        Map<String, Map<String, String>> i18nMap = list.stream()
            .filter(dto -> dto.getLangCd() != null && dto.getI18nId() != null)
            .collect(Collectors.groupingBy(
                dto -> dto.getLangCd(),
                LinkedHashMap::new,
                Collectors.toMap(
                    dto -> dto.getI18nId(),
                    dto -> dto.getI18nMsg() != null ? dto.getI18nMsg() : "",
                    (a, b) -> b,
                    LinkedHashMap::new
                )
            ));
        i18nCache.saveAll(i18nMap);
        return list.size();
    }

    /** ec-pd-cate: 카테고리 전체 목록 reload */
    @Transactional(readOnly = true)
    public int reloadEcPdCate() {
        if (!redis.isEnabled()) return 0;
        ecPdCateCache.evictAll();
        var list = categoryMapper.selectList(Map.of());
        ecPdCateCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        return list.size();
    }

    // ════════════════════════════════════════════════════════════
    //  도메인별 evict only
    // ════════════════════════════════════════════════════════════

    public void evict(String domain) {
        if (!redis.isEnabled()) return;
        switch (domain) {
            case "sy-code"         -> codeCache.evictAll();
            case "sy-menu"         -> menuCache.evictAll();
            case "sy-role"         -> roleCache.evictAll();
            case "sy-role-menu"    -> roleMenuCache.evictAll();
            case "sy-prop"         -> propCache.evictAll();
            case "sy-i18n"         -> i18nCache.evictAll();
            case "ec-pd-prod"      -> ecPdProdCache.evictAll();
            case "ec-pd-cate"      -> ecPdCateCache.evictAll();
            case "ec-pd-cate-prod" -> ecPdCateProdCache.evictAll();
            case "ec-pm-prom"      -> ecPmPromCache.evictAll();
            case "ec-pm-prom-item" -> ecPmPromItemCache.evictAll();
            case "ec-dp-disp"      -> ecDpDispCache.evictAll();
            case "ec-dp-disp-item" -> ecDpDispItemCache.evictAll();
        }
    }

    /** evict 후 -1 반환 (lazy 재적재 대상임을 표시) */
    private int evictAndReturn(String domain) {
        evict(domain);
        return -1;
    }

    // ════════════════════════════════════════════════════════════
    //  멀티 도메인 (^구분)
    // ════════════════════════════════════════════════════════════

    /** "sy-code^sy-menu" 형식으로 여러 도메인 재조회 */
    @Transactional(readOnly = true)
    public Map<String, Integer> reloadMulti(String domains) {
        Map<String, Integer> result = new LinkedHashMap<>();
        Arrays.stream(domains.split("\\^"))
              .map(String::trim)
              .filter(d -> !d.isEmpty())
              .forEach(d -> result.put(d, reloadOne(d)));
        return result;
    }

    /** "sy-code^sy-menu" 형식으로 여러 도메인 evict */
    public void evictMulti(String domains) {
        Arrays.stream(domains.split("\\^"))
              .map(String::trim)
              .filter(d -> !d.isEmpty())
              .forEach(this::evict);
    }

    /** 단일 도메인 reload (switch 위임) */
    @Transactional(readOnly = true)
    public int reloadOne(String domain) {
        return switch (domain) {
            case "sy-code"         -> reloadCode();
            case "sy-menu"         -> reloadMenu();
            case "sy-role"         -> reloadRole();
            case "sy-role-menu"    -> reloadRoleMenu();
            case "sy-prop"         -> reloadProp();
            case "sy-i18n"         -> reloadI18n();
            case "ec-pd-cate"      -> reloadEcPdCate();
            default                -> evictAndReturn(domain);
        };
    }

    // ════════════════════════════════════════════════════════════
    //  캐시 정보 조회
    // ════════════════════════════════════════════════════════════

    /**
     * 도메인별 캐시 상태 반환.
     * - cached: 키 존재 여부
     * - remainTtlSec: 남은 TTL(초). -1=만료없음, -2=키없음/오류
     * - updatedAt: 대략적인 갱신 시각 (now - (configTTL - remainTTL))
     * - keyCount: 패턴 매칭 키 수
     */
    public List<Map<String, Object>> getInfo() {
        if (!redis.isEnabled()) return List.of(Map.of("enabled", false));

        return List.of(
            domainInfo("sy-code",         CacheKey.SY_CODE_ALL,          redisProps.getTtl().getSyCodeSeconds(),         RedisUtil.Target.PRIMARY,   CacheKey.SY_CODE_GRP   + "*"),
            domainInfo("sy-menu",         CacheKey.SY_MENU_ALL,          redisProps.getTtl().getSyMenuSeconds(),         RedisUtil.Target.PRIMARY,   CacheKey.SY_MENU_ROLE  + "*"),
            domainInfo("sy-role",         CacheKey.SY_ROLE_ALL,          redisProps.getTtl().getSyRoleSeconds(),         RedisUtil.Target.PRIMARY,   CacheKey.SY_ROLE_DTL   + "*"),
            domainInfo("sy-role-menu",    CacheKey.SY_ROLE_MENU + "*",   redisProps.getTtl().getSyRoleMenuSeconds(),     RedisUtil.Target.PRIMARY,   null),
            domainInfo("sy-prop",         CacheKey.SY_PROP_ALL,          redisProps.getTtl().getSyPropSeconds(),         RedisUtil.Target.PRIMARY,   CacheKey.SY_PROP_KEY   + "*"),
            domainInfo("sy-i18n",         CacheKey.SY_I18N_ALL,          redisProps.getTtl().getSyI18nSeconds(),         RedisUtil.Target.PRIMARY,   CacheKey.SY_I18N_MSG   + "*"),
            domainInfo("ec-pd-prod",      CacheKey.EC_PD_PROD_ALL + "*", redisProps.getTtl().getEcPdProdSeconds(),       RedisUtil.Target.SECONDARY, null),
            domainInfo("ec-pd-cate",      CacheKey.EC_PD_CATE_ALL,       redisProps.getTtl().getEcPdCateSeconds(),       RedisUtil.Target.SECONDARY, CacheKey.EC_PD_CATE_DTL + "*"),
            domainInfo("ec-pd-cate-prod", CacheKey.EC_PD_CATE_PROD_ALL + "*", redisProps.getTtl().getEcPdCateProdSeconds(), RedisUtil.Target.SECONDARY, null),
            domainInfo("ec-pm-prom",      CacheKey.EC_PM_PROM_ALL + "*", redisProps.getTtl().getEcPmPromSeconds(),       RedisUtil.Target.SECONDARY, null),
            domainInfo("ec-pm-prom-item", CacheKey.EC_PM_PROM_ITEM_ALL + "*", redisProps.getTtl().getEcPmPromItemSeconds(), RedisUtil.Target.SECONDARY, null),
            domainInfo("ec-dp-disp",      CacheKey.EC_DP_DISP_ALL + "*", redisProps.getTtl().getEcDpDispSeconds(),      RedisUtil.Target.SECONDARY, null),
            domainInfo("ec-dp-disp-item", CacheKey.EC_DP_DISP_ITEM_ALL + "*", redisProps.getTtl().getEcDpDispItemSeconds(), RedisUtil.Target.SECONDARY, null)
        );
    }

    private Map<String, Object> domainInfo(String domain, String repKey, long configTtl,
                                            RedisUtil.Target target, String countPattern) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("domain", domain);

        boolean isPattern = repKey.endsWith("*");
        long remainTtl;
        long keyCount;

        if (isPattern) {
            keyCount   = redis.countKeys(repKey, target);
            remainTtl  = keyCount > 0 ? -1L : -2L; // 패턴키는 TTL 개별 조회 생략
        } else {
            remainTtl  = redis.getTtl(repKey, target);
            keyCount   = redis.exists(repKey, target) ? 1L : 0L;
            if (countPattern != null) keyCount += redis.countKeys(countPattern, target);
        }

        boolean cached = keyCount > 0;
        info.put("cached",       cached);
        info.put("keyCount",     keyCount);
        info.put("remainTtlSec", remainTtl);
        info.put("configTtlSec", configTtl);

        if (cached && remainTtl > 0 && configTtl > 0) {
            long updatedEpoch = Instant.now().getEpochSecond() - (configTtl - remainTtl);
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

    // ════════════════════════════════════════════════════════════
    //  내부 유틸
    // ════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object dto) {
        return objectMapper.convertValue(dto, Map.class);
    }
}
