package com.shopjoy.ecadminapi.common.util;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * SecurityContext에서 현재 인증 정보를 꺼내는 유틸.
 *
 * Controller 메서드 파라미터(@AuthenticationPrincipal)나 Service 생성자 주입 없이
 * 어디서든 정적 메서드로 호출할 수 있다.
 *
 * 반환 값:
 * - getUserId()       : 인증된 사용자 ID, 미인증 시 "SYSTEM"
 * - getUserTypeCd()   : "BO"(관리자) | "FO"(고객) | "SO"(판매자), 미인증 시 null
 * - getRoleId()       : 관리자 역할 ID (sy_user.role_id), FO/미인증 시 null
 * - isBo()            : sy_user 관리자 여부
 * - isFo()            : ec_member 고객 여부
 * - isSo()            : Super Owner 여부
 *
 * 주의: @Transactional 메서드 내부에서도 동일 스레드이므로 SecurityContext가 유지된다.
 *       비동기(@Async) 처리 시에는 SecurityContext가 전파되지 않으므로 별도 처리 필요.
 */
public final class SecurityUtil {

    private SecurityUtil() {}

    public static AuthPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal p) {
            return p;
        }
        return null;
    }

    public static String getUserId() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.userId() : "SYSTEM";
    }

    public static String getUserTypeCd() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.userTypeCd() : null;
    }

    public static String getRoleId() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.roleId() : null;
    }

    /** 로그인 여부 (userType 관계없이 인증된 상태면 true) */
    public static boolean isLogin() {
        return currentPrincipal() != null;
    }

    /** sy_user 테이블 사용자 여부 */
    public static boolean isBo() {
        return AuthPrincipal.BO.equals(getUserTypeCd());
    }

    /** ec_member 테이블 사용자 여부 */
    public static boolean isFo() {
        return AuthPrincipal.FO.equals(getUserTypeCd());
    }

    /** So 테이블 사용자 여부 (Super Owner) */
    public static boolean isSo() {
        return "SO".equals(getUserTypeCd());
    }

    /** ROLE_ADMIN 권한 보유 여부 (isBo()와 별개로 권한 기반 체크) */
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
