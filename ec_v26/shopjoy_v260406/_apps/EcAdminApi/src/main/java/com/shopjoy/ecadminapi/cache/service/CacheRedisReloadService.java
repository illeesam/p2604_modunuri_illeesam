package com.shopjoy.ecadminapi.cache.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryMapper;
import com.shopjoy.ecadminapi.base.sy.mapper.*;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import com.shopjoy.ecadminapi.cache.redisstore.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Redis 캐시 갱신/삭제 서비스 (쓰기).
 * CacheRedisReloadController 의 비즈니스 로직 담당.
 *
 * ── 주요 기능 ──────────────────────────────────────────────────────
 * reloadAll()          전체 도메인 evict + DB 재조회
 * reloadMulti(domains) ^ 구분 멀티 도메인 재조회
 * reloadOne(domain)    단일 도메인 재조회
 * evict(domain)        단일 도메인 evict
 * evictMulti(domains)  ^ 구분 멀티 도메인 evict
 *
 * ── reload 지원 도메인 ────────────────────────────────────────────
 * sy-code, sy-menu, sy-role, sy-role-menu, sy-prop, sy-i18n, ec-pd-cate
 *
 * ── evict-only 도메인 (lazy 재적재) ──────────────────────────────
 * ec-pd-prod, ec-pd-cate-prod, ec-pm-prom, ec-pm-prom-item,
 * ec-dp-disp, ec-dp-disp-item
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheRedisReloadService {

    // ── SY CacheStore ─────────────────────────────────────────────
    private final SyCodeRedisStore     codeCache;
    private final SyMenuRedisStore     menuCache;
    private final SyRoleRedisStore     roleCache;
    private final SyRoleMenuRedisStore roleMenuCache;
    private final SyPropRedisStore     propCache;
    private final SyI18nRedisStore     i18nCache;

    // ── EC CacheStore ─────────────────────────────────────────────
    private final EcPdProdRedisStore      ecPdProdCache;
    private final EcPdCateRedisStore      ecPdCateCache;
    private final EcPdCateProdRedisStore  ecPdCateProdCache;
    private final EcPmPromRedisStore      ecPmPromCache;
    private final EcPmPromItemRedisStore  ecPmPromItemCache;
    private final EcDpDispRedisStore      ecDpDispCache;
    private final EcDpDispItemRedisStore  ecDpDispItemCache;

    // ── SY Mapper (DB 재조회) ─────────────────────────────────────
    private final SyCodeMapper         codeMapper;
    private final SyMenuMapper         menuMapper;
    private final SyRoleMapper         roleMapper;
    private final SyRoleMenuMapper     roleMenuMapper;
    private final SyPropMapper         propMapper;
    private final SyI18nMsgMapper      i18nMsgMapper;

    // ── EC Mapper (DB 재조회 — 카테고리만 full reload 지원) ────────
    private final PdCategoryMapper     categoryMapper;

    private final RedisUtil      redis;
    private final ObjectMapper   objectMapper;

    // ════════════════════════════════════════════════════════════
    //  활성 여부
    // ════════════════════════════════════════════════════════════

    public boolean isEnabled() {
        return redis.isEnabled();
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
        log.info("[Cache] 전체 리로드 완료 — {}", result);
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
        log.info("[Cache] sy-code 리로드 완료 — {}건", list.size());
        return list.size();
    }

    /** sy-menu: 전체 목록 저장 */
    @Transactional(readOnly = true)
    public int reloadMenu() {
        if (!redis.isEnabled()) return 0;
        menuCache.evictAll();
        var list = menuMapper.selectList(Map.of());
        menuCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        log.info("[Cache] sy-menu 리로드 완료 — {}건", list.size());
        return list.size();
    }

    /** sy-role: 전체 목록 저장 */
    @Transactional(readOnly = true)
    public int reloadRole() {
        if (!redis.isEnabled()) return 0;
        roleCache.evictAll();
        var list = roleMapper.selectList(Map.of());
        roleCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        log.info("[Cache] sy-role 리로드 완료 — {}건", list.size());
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
        log.info("[Cache] sy-role-menu 리로드 완료 — {}건", list.size());
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
        log.info("[Cache] sy-prop 리로드 완료 — {}건", list.size());
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
        log.info("[Cache] sy-i18n 리로드 완료 — {}건", list.size());
        return list.size();
    }

    /** ec-pd-cate: 카테고리 전체 목록 reload */
    @Transactional(readOnly = true)
    public int reloadEcPdCate() {
        if (!redis.isEnabled()) return 0;
        ecPdCateCache.evictAll();
        var list = categoryMapper.selectList(Map.of());
        ecPdCateCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        log.info("[Cache] ec-pd-cate 리로드 완료 — {}건", list.size());
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
    //  내부 유틸
    // ════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object dto) {
        return objectMapper.convertValue(dto, Map.class);
    }
}
