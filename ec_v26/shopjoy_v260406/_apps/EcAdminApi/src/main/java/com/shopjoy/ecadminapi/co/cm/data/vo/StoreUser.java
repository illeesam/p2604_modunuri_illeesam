package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자(관리자) 정보 VO
 * - sy_user 테이블 기반
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreUser {
    private String authId;             // 인증 식별자 (BO = sy_user.user_id)
    private String userId;
    private String loginId;           // 로그인 ID
    private String userName;
    private String userEmail;
    private String userHpNo;          // 휴대폰 번호
    private String siteId;            // 사이트 ID
    private String deptId;            // 부서 ID
    private String deptNm;            // 부서명
    private String roleId;            // 역할 ID
    private String roleNm;            // 역할명
    private String memberGradeCd;     // 회원등급 코드
    private String userStatusCd;      // 상태 (ACTIVE, INACTIVE)
    private String userTypeCd;        // 사용자 타입 (BO, FO, SO)
    private String isAdminYn;         // 관리자 여부 (Y/N)
    private String vendorId;          // 업체 ID
    private String vendorNm;          // 업체명
    private String loginSnsChannelCd; // SNS 로그인 채널 (KAKAO, NAVER 등)
    private String boBookmarks;       // 즐겨찾기 메뉴 (sy_user_bookmark)
}
