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
 * - currentUserId()   : 인증된 사용자 ID, 미인증 시 "SYSTEM"
 * - currentUserType() : "USER"(관리자) | "MEMBER"(고객), 미인증 시 null
 * - currentRoleId()   : 관리자 역할 ID (sy_user.role_id), MEMBER/미인증 시 null
 * - isUser()          : sy_user 관리자 여부
 * - isMember()        : ec_member 고객 여부
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

    public static String currentUserId() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.userId() : "SYSTEM";
    }

    public static String currentUserType() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.userType() : null;
    }

    public static String currentRoleId() {
        AuthPrincipal p = currentPrincipal();
        return p != null ? p.roleId() : null;
    }

    /** 로그인 여부 (userType 관계없이 인증된 상태면 true) */
    public static boolean isLogin() {
        return currentPrincipal() != null;
    }

    /** sy_user 테이블 사용자 여부 */
    public static boolean isUser() {
        return AuthPrincipal.USER.equals(currentUserType());
    }

    /** ec_member 테이블 사용자 여부 */
    public static boolean isMember() {
        return AuthPrincipal.MEMBER.equals(currentUserType());
    }

    /** ROLE_ADMIN 권한 보유 여부 (isUser()와 별개로 권한 기반 체크) */
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
