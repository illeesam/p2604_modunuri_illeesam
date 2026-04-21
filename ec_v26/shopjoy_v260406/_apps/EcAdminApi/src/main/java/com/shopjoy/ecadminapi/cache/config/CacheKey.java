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

    // ── BO 관리자 세션 (BoAuthCacheStore) ────────────────────────
    public static final String BO_AUTH_SESSION      = "bo:auth:session:";
    public static final String BO_AUTH_BLACKLIST    = "bo:auth:blacklist:";

    // ── FO 회원 세션 (FoAuthCacheStore) ──────────────────────────
    public static final String FO_AUTH_SESSION      = "fo:auth:session:";
    public static final String FO_AUTH_BLACKLIST    = "fo:auth:blacklist:";

    // ── EXT 외부 세션 (ExtAuthCacheStore) ────────────────────────
    public static final String EXT_AUTH_SESSION     = "ext:auth:session:";
    public static final String EXT_AUTH_BLACKLIST   = "ext:auth:blacklist:";

    // ════════════════════════════════════════════════════════════
    //  SY 영역  (시스템 공통 — 코드·메뉴·역할·프로퍼티·다국어)
    // ════════════════════════════════════════════════════════════

    // ── 공통코드 (SyCodeCacheStore) ──────────────────────────────
    public static final String SY_CODE_GRP          = "sy:code:grp:";
    public static final String SY_CODE_ALL          = "sy:code:all";

    // ── 메뉴 (SyMenuCacheStore) ───────────────────────────────────
    public static final String SY_MENU_ALL          = "sy:menu:all";
    public static final String SY_MENU_ROLE         = "sy:menu:role:";

    // ── 역할 (SyRoleCacheStore) ───────────────────────────────────
    public static final String SY_ROLE_ALL          = "sy:role:all";
    public static final String SY_ROLE_DTL          = "sy:role:dtl:";

    // ── 역할-메뉴 매핑 (SyRoleMenuCacheStore) ────────────────────
    public static final String SY_ROLE_MENU         = "sy:role:menu:";

    // ── 시스템 프로퍼티 (SyPropCacheStore) ──────────────────────
    public static final String SY_PROP_ALL          = "sy:prop:all";
    public static final String SY_PROP_KEY          = "sy:prop:key:";

    // ── 다국어 (SyI18nCacheStore) ─────────────────────────────────
    public static final String SY_I18N_ALL          = "sy:i18n:all";
    public static final String SY_I18N_MSG          = "sy:i18n:msg:";

    // ════════════════════════════════════════════════════════════
    //  EC 영역  (전자상거래 — 상품·카테고리·프로모션·전시)
    // ════════════════════════════════════════════════════════════

    // ── 상품 (EcPdProdCacheStore) ─────────────────────────────────
    public static final String EC_PD_PROD_DTL      = "ec:pd:prod:dtl:";
    public static final String EC_PD_PROD_ALL      = "ec:pd:prod:all:";

    // ── 카테고리 (EcPdCateCacheStore) ────────────────────────────
    public static final String EC_PD_CATE_DTL      = "ec:pd:cate:dtl:";
    public static final String EC_PD_CATE_ALL      = "ec:pd:cate:all";

    // ── 카테고리 상품 (EcPdCateProdCacheStore) ────────────────────
    public static final String EC_PD_CATE_PROD_DTL = "ec:pd:cate:prod:dtl:";
    public static final String EC_PD_CATE_PROD_ALL = "ec:pd:cate:prod:all:";

    // ── 프로모션 (EcPmPromCacheStore) ────────────────────────────
    public static final String EC_PM_PROM_DTL      = "ec:pm:prom:dtl:";
    public static final String EC_PM_PROM_ALL      = "ec:pm:prom:all:";

    // ── 프로모션 항목 (EcPmPromItemCacheStore) ────────────────────
    public static final String EC_PM_PROM_ITEM_DTL = "ec:pm:prom:item:dtl:";
    public static final String EC_PM_PROM_ITEM_ALL = "ec:pm:prom:item:all:";

    // ── 전시 (EcDpDispCacheStore) ─────────────────────────────────
    public static final String EC_DP_DISP_DTL      = "ec:dp:disp:dtl:";
    public static final String EC_DP_DISP_ALL      = "ec:dp:disp:all:";

    // ── 전시 항목 (EcDpDispItemCacheStore) ────────────────────────
    public static final String EC_DP_DISP_ITEM_DTL = "ec:dp:disp:item:dtl:";
    public static final String EC_DP_DISP_ITEM_ALL = "ec:dp:disp:item:all:";

    private CacheKey() {}
}
