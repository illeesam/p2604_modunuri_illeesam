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
public class StoreUserInfo {
    private String userId;
    private String userName;
    private String userEmail;
    private String userHpNo;          // 휴대폰 번호
    private String deptId;            // 부서 ID
    private String deptNm;            // 부서명
    private String roleId;            // 역할 ID
    private String roleNm;            // 역할명
    private String userStatusCd;      // 상태 (ACTIVE, INACTIVE)
    private String isAdminYn;         // 관리자 여부 (Y/N)
    private String companyId;         // 회사 ID
    private String companyNm;         // 회사명
    private String boBookmarks;       // 즐겨찾기 메뉴 (sy_user_bookmark)
}
