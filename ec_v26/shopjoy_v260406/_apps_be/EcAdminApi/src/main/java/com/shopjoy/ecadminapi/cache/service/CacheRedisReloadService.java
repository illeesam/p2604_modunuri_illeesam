package com.shopjoy.ecadminapi.cache.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import com.shopjoy.ecadminapi.cache.redisstore.*;
import com.shopjoy.ecadminapi.common.util.CmUtil;
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
@Transactional(readOnly = true)
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

    // ── SY Repository (DB 재조회) ─────────────────────────────────
    private final SyCodeRepository     codeRepository;
    private final SyMenuRepository     menuRepository;
    private final SyRoleRepository     roleRepository;
    private final SyRoleMenuRepository roleMenuRepository;
    private final SyPropRepository     propRepository;
    private final SyI18nRepository     i18nRepository;

    // ── EC Mapper (DB 재조회 — 카테고리만 full reload 지원) ────────
    private final PdCategoryRepository categoryRepository;

    private final RedisUtil      redis;
    private final ObjectMapper   objectMapper;

    // ════════════════════════════════════════════════════════════
    //  활성 여부
    // ════════════════════════════════════════════════════════════

    /* isEnabled */
    public boolean isEnabled() {
        return redis.isEnabled();
    }

    // ════════════════════════════════════════════════════════════
    //  전체 재조회
    // ════════════════════════════════════════════════════════════

    /* reloadAll */
    public Map<String, Integer> reloadAll() {
        Map<String, Integer> result = new LinkedHashMap<>();
        // SY: 건수 소 → DB 즉시 재적재
        result.put("sy-code",      reloadCode());                        // 공통코드
        result.put("sy-menu",      reloadMenu());                        // 메뉴 구조
        result.put("sy-role",      reloadRole());                        // 역할 정보
        result.put("sy-role-menu", reloadRoleMenu());                    // 역할-메뉴 매핑
        result.put("sy-prop",      reloadProp());                        // 시스템 프로퍼티
        result.put("sy-i18n",      reloadI18n());                        // 다국어 메시지
        // EC: 카테고리만 reload, 나머지는 evict-only(lazy 재적재) — siteId별 키 다수
        result.put("ec-pd-cate",      reloadEcPdCate());                 // 카테고리 (reload)
        result.put("ec-pd-prod",      evictAndReturn("ec-pd-prod"));     // 상품 (evict-only)
        result.put("ec-pd-cate-prod", evictAndReturn("ec-pd-cate-prod")); // 카테고리-상품 (evict-only)
        result.put("ec-pm-prom",      evictAndReturn("ec-pm-prom"));     // 프로모션 (evict-only)
        result.put("ec-pm-prom-item", evictAndReturn("ec-pm-prom-item")); // 프로모션 항목 (evict-only)
        result.put("ec-dp-disp",      evictAndReturn("ec-dp-disp"));     // 전시 (evict-only)
        result.put("ec-dp-disp-item", evictAndReturn("ec-dp-disp-item")); // 전시 항목 (evict-only)
        log.info("[Cache] 전체 리로드 완료 — {}", result);
        return result;
    }

    // ════════════════════════════════════════════════════════════
    //  도메인별 재조회
    // ════════════════════════════════════════════════════════════

    /** sy-code: codeGrp 기준으로 그룹핑하여 저장 */
    public int reloadCode() {
        if (!redis.isEnabled()) return 0;
        codeCache.evictAll();
        // [쿼리 메서드] Code 목록 조회
        List<SyCodeDto.Item> list = codeRepository.selectList(new com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto.Request());
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
    public int reloadMenu() {
        if (!redis.isEnabled()) return 0;
        menuCache.evictAll();
        // [쿼리 메서드] Menu 목록 조회
        List<SyMenuDto.Item> list = menuRepository.selectList(new com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto.Request());
        menuCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        log.info("[Cache] sy-menu 리로드 완료 — {}건", list.size());
        return list.size();
    }

    /** sy-role: 전체 목록 저장 */
    public int reloadRole() {
        if (!redis.isEnabled()) return 0;
        roleCache.evictAll();
        // [쿼리 메서드] Role 목록 조회
        List<SyRoleDto.Item> list = roleRepository.selectList(new com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto.Request());
        roleCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        log.info("[Cache] sy-role 리로드 완료 — {}건", list.size());
        return list.size();
    }

    /** sy-role-menu: roleId 기준으로 그룹핑하여 menuId 목록 저장 */
    public int reloadRoleMenu() {
        if (!redis.isEnabled()) return 0;
        roleMenuCache.evictAll();
        // [쿼리 메서드] RoleMenu 목록 조회
        List<SyRoleMenuDto.Item> list = roleMenuRepository.selectList(new com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto.Request());
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
    public int reloadProp() {
        if (!redis.isEnabled()) return 0;
        propCache.evictAll();
        // [쿼리 메서드] Prop 목록 조회
        List<SyPropDto.Item> list = propRepository.selectList(new SyPropDto.Request());
        Map<String, String> propMap = list.stream()
            .filter(dto -> dto.getPropKey() != null)
            .collect(Collectors.toMap(
                dto -> dto.getPropKey(),
                dto -> CmUtil.nvlStr(dto.getPropValue()),
                (a, b) -> b,
                LinkedHashMap::new
            ));
        propCache.saveAll(propMap);
        log.info("[Cache] sy-prop 리로드 완료 — {}건", list.size());
        return list.size();
    }

    /** sy-i18n: langCd → (i18nKey → 메시지) 중첩 맵으로 저장
     *
     *  2026-08-13 ① sy_i18n_msg(행) → sy_i18n 언어컬럼(ko/en/cn/ja) 통합
     *             ② 캐시 키를 i18nId → **i18nKey** 로 전환
     *
     *  ②가 중요하다. 호출부는 t('common.bt.save') 처럼 **키로** 조회하는데
     *  캐시가 i18nId 로 잡혀 있으면 매번 키→ID 를 다시 찾아야 해 캐시가 무의미했다.
     *  i18n_key 는 UNIQUE 이므로 단독 식별자로 안전하다.
     *
     *  값이 비어 있는 언어는 담지 않는다 — 빈 문자열이 쌓이면
     *  "번역 있음"으로 오인돼 폴백(기본 언어)이 동작하지 않는다. */
    public int reloadI18n() {
        if (!redis.isEnabled()) return 0;
        i18nCache.evictAll();
        // [쿼리 메서드] I18n 목록 조회
        List<SyI18nDto.Item> list = i18nRepository.selectList(new SyI18nDto.Request());
        Map<String, Map<String, String>> i18nMap = new LinkedHashMap<>();
        for (String lang : List.of("ko", "en", "cn", "ja")) {
            Map<String, String> byKey = new LinkedHashMap<>();
            for (SyI18nDto.Item it : list) {
                if (it.getI18nKey() == null || it.getI18nKey().isBlank()) continue;
                String msg = switch (lang) {
                    case "ko" -> it.getI18nMsgKo();
                    case "en" -> it.getI18nMsgEn();
                    case "cn" -> it.getI18nMsgCn();
                    default   -> it.getI18nMsgJa();
                };
                if (msg != null && !msg.isBlank()) byKey.put(it.getI18nKey(), msg);
            }
            if (!byKey.isEmpty()) i18nMap.put(lang, byKey);
        }
        int total = i18nMap.values().stream().mapToInt(Map::size).sum();
        i18nCache.saveAll(i18nMap);
        log.info("[Cache] sy-i18n 리로드 완료 — 키 {}건 / 번역 {}건", list.size(), total);
        return total;
    }

    /** ec-pd-cate: 카테고리 전체 목록 reload */
    public int reloadEcPdCate() {
        if (!redis.isEnabled()) return 0;
        ecPdCateCache.evictAll();
        // [쿼리 메서드] Category 목록 조회
        List<com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto.Item> list = categoryRepository.selectList(new com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto.Request());
        ecPdCateCache.saveAll(list.stream().map(this::toMap).collect(Collectors.toList()));
        log.info("[Cache] ec-pd-cate 리로드 완료 — {}건", list.size());
        return list.size();
    }

    // ════════════════════════════════════════════════════════════
    //  도메인별 evict only
    // ════════════════════════════════════════════════════════════

    /* evict */
    public void evict(String domain) {
        if (!redis.isEnabled()) return;
        switch (domain) {
            case "sy-code"         -> codeCache.evictAll();         // 공통코드
            case "sy-menu"         -> menuCache.evictAll();         // 메뉴 구조
            case "sy-role"         -> roleCache.evictAll();         // 역할 정보
            case "sy-role-menu"    -> roleMenuCache.evictAll();     // 역할-메뉴 매핑
            case "sy-prop"         -> propCache.evictAll();         // 시스템 프로퍼티
            case "sy-i18n"         -> i18nCache.evictAll();         // 다국어 메시지
            case "ec-pd-prod"      -> ecPdProdCache.evictAll();     // 상품
            case "ec-pd-cate"      -> ecPdCateCache.evictAll();     // 카테고리
            case "ec-pd-cate-prod" -> ecPdCateProdCache.evictAll(); // 카테고리-상품
            case "ec-pm-prom"      -> ecPmPromCache.evictAll();     // 프로모션
            case "ec-pm-prom-item" -> ecPmPromItemCache.evictAll(); // 프로모션 항목
            case "ec-dp-disp"      -> ecDpDispCache.evictAll();     // 전시
            case "ec-dp-disp-item" -> ecDpDispItemCache.evictAll(); // 전시 항목
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

    /* toMap */
    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object dto) {
        return objectMapper.convertValue(dto, Map.class);
    }
}
