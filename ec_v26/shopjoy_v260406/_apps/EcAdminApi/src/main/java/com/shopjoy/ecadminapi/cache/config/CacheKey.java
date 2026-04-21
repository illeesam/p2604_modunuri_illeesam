package com.shopjoy.ecadminapi.cache.config;

/**
 * Redis 캐시 키 프리픽스 상수.
 *
 * 키 구조: {도메인}:{서브}:{식별자}
 *   예) bo:auth:session:admin01
 *       sy:code:grp:ORDER_STATUS
 *       ec:pd:prod:dtl:P20260101001
 */
public final class CacheKey {

    // ════════════════════════════════════════════════════════════
    //  AUTH 영역  (BO / FO / EXT 인증 세션·블랙리스트)
    // ════════════════════════════════════════════════════════════

    // ── BO 관리자 세션 (BoAuthRedisStore) ────────────────────────
    public static final String BO_AUTH_SESSION      = "bo:auth:session:";    // {userId} → JWT 세션
    public static final String BO_AUTH_BLACKLIST    = "bo:auth:blacklist:";  // {userId} → 블랙리스트 토큰

    // ── FO 회원 세션 (FoAuthRedisStore) ──────────────────────────
    public static final String FO_AUTH_SESSION      = "fo:auth:session:";    // {memberId} → JWT 세션
    public static final String FO_AUTH_BLACKLIST    = "fo:auth:blacklist:";  // {memberId} → 블랙리스트 토큰

    // ── EXT 외부 세션 (ExtAuthRedisStore) ────────────────────────
    public static final String EXT_AUTH_SESSION     = "ext:auth:session:";   // {userId} → JWT 세션
    public static final String EXT_AUTH_BLACKLIST   = "ext:auth:blacklist:"; // {userId} → 블랙리스트 토큰

    // ════════════════════════════════════════════════════════════
    //  SY 영역  (시스템 공통 — 코드·메뉴·역할·프로퍼티·다국어)
    // ════════════════════════════════════════════════════════════

    // ── 공통코드 (SyCodeRedisStore) ──────────────────────────────
    public static final String SY_CODE_GRP          = "sy:code:grp:";       // {codeGrp} → List<코드>
    public static final String SY_CODE_ALL          = "sy:code:all";         // Map<codeGrp, List<코드>>

    // ── 메뉴 (SyMenuRedisStore) ───────────────────────────────────
    public static final String SY_MENU_ALL          = "sy:menu:all";         // List<메뉴> 전체
    public static final String SY_MENU_ROLE         = "sy:menu:role:";       // {roleId} → List<menuId>

    // ── 역할 (SyRoleRedisStore) ───────────────────────────────────
    public static final String SY_ROLE_ALL          = "sy:role:all";         // List<역할> 전체
    public static final String SY_ROLE_DTL          = "sy:role:dtl:";        // {roleId} → 역할 상세

    // ── 역할-메뉴 매핑 (SyRoleMenuRedisStore) ────────────────────
    public static final String SY_ROLE_MENU         = "sy:role:menu:";       // {roleId} → List<menuId>

    // ── 시스템 프로퍼티 (SyPropRedisStore) ──────────────────────
    public static final String SY_PROP_ALL          = "sy:prop:all";         // Map<propKey, propValue>
    public static final String SY_PROP_KEY          = "sy:prop:key:";        // {propKey} → propValue

    // ── 다국어 (SyI18nRedisStore) ─────────────────────────────────
    public static final String SY_I18N_ALL          = "sy:i18n:all";         // Map<langCd, Map<i18nId, msg>>
    public static final String SY_I18N_MSG          = "sy:i18n:msg:";        // {langCd}:{i18nId} → msg

    // ════════════════════════════════════════════════════════════
    //  EC 영역  (전자상거래 — 상품·카테고리·프로모션·전시)
    // ════════════════════════════════════════════════════════════

    // ── 상품 (EcPdProdRedisStore) ─────────────────────────────────
    public static final String EC_PD_PROD_DTL      = "ec:pd:prod:dtl:";      // {prodId} → 상품 상세
    public static final String EC_PD_PROD_ALL      = "ec:pd:prod:all:";      // {siteId} → List<상품>

    // ── 카테고리 (EcPdCateRedisStore) ────────────────────────────
    public static final String EC_PD_CATE_DTL      = "ec:pd:cate:dtl:";      // {cateId} → 카테고리 상세
    public static final String EC_PD_CATE_ALL      = "ec:pd:cate:all";        // List<카테고리> 전체

    // ── 카테고리 상품 (EcPdCateProdRedisStore) ────────────────────
    public static final String EC_PD_CATE_PROD_DTL = "ec:pd:cate:prod:dtl:"; // {cateId} → List<상품>
    public static final String EC_PD_CATE_PROD_ALL = "ec:pd:cate:prod:all:"; // {siteId} → Map<cateId, List<상품>>

    // ── 프로모션 (EcPmPromRedisStore) ────────────────────────────
    public static final String EC_PM_PROM_DTL      = "ec:pm:prom:dtl:";      // {promId} → 프로모션 상세
    public static final String EC_PM_PROM_ALL      = "ec:pm:prom:all:";      // {siteId} → List<프로모션>

    // ── 프로모션 항목 (EcPmPromItemRedisStore) ────────────────────
    public static final String EC_PM_PROM_ITEM_DTL = "ec:pm:prom:item:dtl:"; // {promId} → List<항목>
    public static final String EC_PM_PROM_ITEM_ALL = "ec:pm:prom:item:all:"; // {siteId} → Map<promId, List<항목>>

    // ── 전시 (EcDpDispRedisStore) ─────────────────────────────────
    public static final String EC_DP_DISP_DTL      = "ec:dp:disp:dtl:";      // {dispId} → 전시 상세
    public static final String EC_DP_DISP_ALL      = "ec:dp:disp:all:";      // {siteId} → List<전시>

    // ── 전시 항목 (EcDpDispItemRedisStore) ────────────────────────
    public static final String EC_DP_DISP_ITEM_DTL = "ec:dp:disp:item:dtl:"; // {dispId} → List<항목>
    public static final String EC_DP_DISP_ITEM_ALL = "ec:dp:disp:item:all:"; // {siteId} → Map<dispId, List<항목>>

    private CacheKey() {}
}
