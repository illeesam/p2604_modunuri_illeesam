package com.shopjoy.ecBeBo.common.util;

import com.shopjoy.ecBeBo.co.auth.security.AuthPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/**
 * SecurityContext에서 현재 인증 정보를 꺼내는 유틸.
 *
 * Controller 메서드 파라미터(@AuthenticationPrincipal)나 Service 생성자 주입 없이
 * 어디서든 정적 메서드로 호출할 수 있다.
 *
 * 반환 값:
 * - getUserId()       : 인증된 사용자 ID, 미인증 시 "SYSTEM"
 * - getAppTypeCd()   : "BO"(관리자) | "FO"(고객) | "SO"(판매자), 미인증 시 null
 * - getRoleId()       : 관리자 역할 ID (sy_user.role_id), FO/미인증 시 null
 * - getVendorId()     : 업체 ID
 * - isBo()            : sy_user 관리자 여부
 * - isFo()            : ec_member 고객 여부
 * - isSo()            : Super Owner 여부
 *
 * 주의: @Transactional 메서드 내부에서도 동일 스레드이므로 SecurityContext가 유지된다.
 *       비동기(@Async) 처리 시에는 SecurityContext가 전파되지 않으므로 별도 처리 필요.
 */
public final class SecurityUtil {

    /** 유틸 클래스 — 인스턴스화 금지. */
    private SecurityUtil() {}

    /**
     * SecurityContext 의 현재 인증 Principal 을 {@link AuthPrincipal} 로 반환.
     *
     * <p>모든 조회 메서드의 기반. 인증이 없거나 Principal 타입이 AuthPrincipal 이 아니면 null.
     *
     * @return 현재 AuthPrincipal, 미인증/타입 불일치 시 null
     */
    public static AuthPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal p) {
            return p;
        }
        return null;
    }

    /**
     * 현재 인증된 사용자의 전체 {@link AuthPrincipal} 반환 (미인증 시 빈 기본 객체).
     *
     * <p>null 체크 없이 authId() 등을 호출하는 호출부를 위해 미인증 시에도 NPE 가 나지 않도록
     * 모든 필드가 빈 값("")인 더미 Principal 을 반환한다(권한 플래그는 "N").
     *
     * @return AuthPrincipal (항상 non-null)
     */
    public static AuthPrincipal getAuthUser() {
        AuthPrincipal p = currentPrincipal();
        if (p != null) return p;
        return new AuthPrincipal(
            "", "", null, "", "", "", "", "", "", List.of(), "", "", "", "", "N", "N"
        );
    }

    /**
     * 로그인 여부.
     *
     * @return AppType 무관하게 인증된 상태면 true
     */
    public static boolean isLogin() {
        AuthPrincipal p = currentPrincipal();
        return p != null;
    }

    /**
     * 관리자(sy_user, BO) 사용자 여부.
     *
     * @return appTypeCd 가 BO 면 true
     */
    public static boolean isBo() {
        AuthPrincipal p = currentPrincipal();
        return p != null && AuthPrincipal.BO.equals(p.appTypeCd());
    }

    /**
     * 고객(ec_member, FO) 사용자 여부.
     *
     * @return appTypeCd 가 FO 면 true
     */
    public static boolean isFo() {
        AuthPrincipal p = currentPrincipal();
        return p != null && AuthPrincipal.FO.equals(p.appTypeCd());
    }

    /**
     * Super Owner(SO) 사용자 여부.
     *
     * @return appTypeCd 가 "SO" 면 true
     */
    public static boolean isSo() {
        AuthPrincipal p = currentPrincipal();
        return p != null && "SO".equals(p.appTypeCd());
    }

    /**
     * 대표(기본) 사이트 ID — 미인증/미설정 요청이 떨어질 자리.
     *
     * <p>여기저기 문자열로 박아두면 값이 갈린다. 실제로 존재하지 않는 {@code SecurityUtil.DEFAULT_SITE_ID} 이
     * 기본값으로 하드코딩돼 있어 sy_site 에 없는 site_id 로 데이터가 쌓였다(2026-07-28 정리).
     * 기본 사이트가 필요하면 반드시 이 상수를 쓴다.</p>
     */
    public static final String DEFAULT_SITE_ID = "2604010000000001";

    /**
     * 현재 인증된 사용자의 siteId 반환.
     *
     * @return siteId, 미인증/미설정 시 "" (멀티사이트 격리 쿼리 파라미터로 사용)
     */
    public static String getSiteId() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.siteId() : "";
    }

    /**
     * 현재 인증된 사용자의 siteId 반환, 없으면(미인증/공백) 지정 기본(대표) 사이트.
     *
     * <p>FO 서비스에서 비회원 공개 조회 시 siteId 격리 강제용.
     *
     * @param defaultSiteId 미인증/미설정 시 사용할 대표 사이트 ID
     * @return 인증 사이트 ID 또는 defaultSiteId
     */
    public static String getSiteIdOrDefault(String defaultSiteId) {
        String siteId = getSiteId();
        return (siteId != null && !siteId.isBlank()) ? siteId : defaultSiteId;
    }

    /** 인증 사이트, 없으면 {@link #DEFAULT_SITE_ID} — 기본값을 호출부마다 적지 않도록 */
    public static String getSiteIdOrDefault() {
        return getSiteIdOrDefault(DEFAULT_SITE_ID);
    }

    /**
     * BO_GUEST 권한 보유 여부.
     *
     * <p>{@link #isBo()}(AppType 기반)와 달리 Spring Security authorities 기반으로 체크한다.
     * 인증 자체가 없으면 false.
     *
     * @return BO_GUEST authority 보유 시 true
     */
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .anyMatch(a -> "BO_GUEST".equals(a.getAuthority()));
    }

    /**
     * 민감정보(연락처/주소/계좌 등) 원본 열람 권한 보유 여부.
     *
     * <p>로그인 시 {@code BoAuthService.buildAccessToken}이 사용자의 {@code sy_role.sensitive_view_yn}
     * 을 확인해 'Y' 인 경우에만 JWT authorities 에 {@code SENSITIVE_VIEW} 를 추가한다. 역할 변경은
     * 다음 로그인/토큰갱신부터 반영된다(다른 role 기반 권한과 동일한 방식 — 매 요청마다 DB 조회하지 않음).
     *
     * <p>false 인 경우 {@link com.shopjoy.ecBeBo.common.util.MaskUtil} 이 회원 연락처/주소 등을
     * 마스킹(***)해 응답·엑셀 양쪽에 적용한다. 인증 자체가 없으면 false(미인증 = 원본 열람 불가).
     *
     * @return SENSITIVE_VIEW authority 보유 시 true
     */
    public static boolean hasSensitiveViewAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .anyMatch(a -> "SENSITIVE_VIEW".equals(a.getAuthority()));
    }

    /**
     * 현재 인증된 사용자의 authId 반환, 없으면 지정 기본값.
     *
     * @param defaultValue authId 가 null/empty 또는 미인증일 때 반환할 값
     * @return authId 또는 defaultValue
     */
    public static String getAuthIdOrDefault(String defaultValue) {
        AuthPrincipal p = currentPrincipal();
        if (p != null && p.authId() != null && !p.authId().isEmpty()) {
            return p.authId();
        }
        return defaultValue;
    }

    /**
     * 현재 인증된 사용자의 authId 반환, 없으면 "GUEST".
     *
     * <p>등록자/수정자(regBy/updBy) 기본값 등에 사용.
     *
     * @return authId 또는 "GUEST"
     */
    public static String getAuthIdOrGuest() {
        return getAuthIdOrDefault("GUEST");
    }
}
