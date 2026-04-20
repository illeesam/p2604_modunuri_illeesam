package com.shopjoy.ecadminapi.auth.security;

/**
 * SecurityContext에 저장되는 인증 주체.
 *
 * Spring Security의 기본 UserDetails 대신 사용하는 이유:
 * - 이 시스템은 관리자(sy_user)와 고객(ec_member) 두 사용자 테이블이 존재하며,
 *   어느 테이블에서 인증된 사용자인지 런타임에 구분해야 한다.
 * - UserDetails는 단일 사용자 저장소를 전제하므로 userType 개념이 없음.
 * - JWT 클레임에서 바로 구성해 SecurityContext에 저장하므로 DB 조회 불필요.
 *
 * userType 값:
 * - "USER"   → sy_user  (관리자, Back Office)
 * - "MEMBER" → ec_member (고객, Front Office)
 *
 * 사용: SecurityUtil.currentUserId() / currentUserType() / isUser() / isMember()
 */
public record AuthPrincipal(String userId, String userType, String roleId) {

    public static final String USER   = "USER";
    public static final String MEMBER = "MEMBER";
}
