package com.shopjoy.ecadminapi.auth.security;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SecurityContext에 저장되는 인증 주체.
 *
 * Spring Security의 기본 UserDetails 대신 사용하는 이유:
 * - 이 시스템은 관리자(sy_user)와 고객(ec_member) 두 사용자 테이블이 존재하며,
 *   어느 테이블에서 인증된 사용자인지 런타임에 구분해야 한다.
 * - UserDetails는 단일 사용자 저장소를 전제하므로 userType 개념이 없음.
 * - JWT 클레임에서 바로 구성해 SecurityContext에 저장하므로 DB 조회 불필요.
 *
 * userTypeCd 값:
 * - "BO" → sy_user  (관리자, Back Office)
 * - "FO" → ec_member (고객, Front Office)
 * - "SO" → Super Owner (판매자)
 *
 * authId 규칙:
 * - userTypeCd="BO" → authId = sy_user.user_id
 * - userTypeCd="FO" → authId = ec_member.member_id
 * - JWT subject에 저장되는 통합 인증 식별자
 *
 * 사용: SecurityUtil.getAuthId() / getUserId() / getMemberId() / getUserTypeCd() / isBo() / isFo()
 * ★ 는 인증되면 공통항목
 */
public record AuthPrincipal(
        String authId,              // ★ 인증 식별자 (BO=sy_user.user_id, FO=ec_member.member_id), JWT subject
        String userTypeCd,          // ★ 사용자 유형 (BO:backend사용자, FO:frontend회원, SO:판매자)
        LocalDateTime loginTime,    // ★ 로그인 시간
        String roleId,              // ★ 권한 아이디 (sy_user.role_id, BO 전용)
        String userNm,              // ★ 사용자명 (sy_user.user_nm 또는 ec_member.member_nm)
        String accessToken,         // ★ 액세스 토큰
        String refreshToken,        // ★ 리프레시 토큰
        String siteId,              // ★ 사이트 아이디
        String deptId,              // ★ 부서 아이디 (sy_user.dept_id, BO 전용)
        List<String> roles,         // ★ 권한 목록 (ROLE_*)
        String userId,              // BO 전용: sy_user.user_id (authId와 동일값, 명시적 접근용)
        String memberId,            // FO 전용: ec_member.member_id (authId와 동일값, 명시적 접근용)
        String vendorId,            // 업체 아이디
        String memberGrade,         // 회원 등급 (ec_member.grade_cd, FO 전용)
        String isAdminYn,           // 관리자 여부 (Y/N)
        String isStaffYn            // 직원 여부 (Y/N)
) {

    public static final String BO = "BO";
    public static final String FO = "FO";
    public static final String SO = "SO";
    public static final String EXT = "EXT";

    // 간단한 생성 팩토리 (최소 필드만)
    public static AuthPrincipal of(String authId, String userTypeCd, String roleId) {
        String userId   = BO.equals(userTypeCd) ? authId : "";
        String memberId = FO.equals(userTypeCd) ? authId : "";
        return new AuthPrincipal(
                authId,                 // authId
                userTypeCd,             // userTypeCd
                LocalDateTime.now(),    // loginTime
                roleId,                 // roleId
                "",                     // userNm
                "",                     // accessToken
                "",                     // refreshToken
                "",                     // siteId
                "",                     // deptId
                List.of(),              // roles
                userId,                 // userId  (BO 전용)
                memberId,               // memberId (FO 전용)
                "",                     // vendorId
                "",                     // memberGrade
                "N",                    // isAdminYn
                "N"                     // isStaffYn
        );
    }
}
