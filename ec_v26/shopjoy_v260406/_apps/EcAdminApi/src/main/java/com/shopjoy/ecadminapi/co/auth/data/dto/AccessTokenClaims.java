package com.shopjoy.ecadminapi.co.auth.data.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Access Token 클레임 정보를 캡슐화한 DTO.
 * JWT 토큰 생성 시 필요한 모든 정보를 한 객체로 관리하여
 * 파라미터 개수 증가에 따른 혼동을 방지.
 *
 * authId 규칙:
 * - userTypeCd="BO" → authId = sy_user.user_id
 * - userTypeCd="FO" → authId = ec_member.member_id
 */
@Getter
@Builder
public class AccessTokenClaims {
    private String authId;              // 인증 식별자 (JWT subject): BO=user_id, FO=member_id
    private String loginId;             // 로그인 ID (계정 문자열)
    private List<String> roles;         // 권한 목록
    private String userTypeCd;          // 사용자 유형 (BO/FO/SO)
    private String roleId;              // 역할 ID (BO 전용)
    private String vendorId;            // 업체 ID
    private String siteId;              // 사이트 ID
    private String userId;              // BO 전용: sy_user.user_id (authId와 동일값)
    private String memberId;            // FO 전용: ec_member.member_id (authId와 동일값)
    private String memberGrade;         // 회원 등급 (FO 전용)
    private String isStaffYn;           // 직원 여부 (Y/N)
    private String isAdminYn;           // 관리자 여부 (Y/N)
}
