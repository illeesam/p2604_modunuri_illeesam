package com.shopjoy.ecadminapi.bo.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * BO (Back Office) 애플리케이션 초기화 데이터 응답 VO
 * - 로그인 후 필요한 모든 초기화 데이터를 한 번에 조회
 * - localStorage와 Pinia store에 저장할 데이터 포함
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoAppInitDataRes {

    // ════════════════════════════════════════════════════════════════
    // [인증] 토큰 정보
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private AuthInfo auth = new AuthInfo();

    // ════════════════════════════════════════════════════════════════
    // [사용자] 관리자 정보
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private UserInfo user = new UserInfo();

    // ════════════════════════════════════════════════════════════════
    // [권한] 역할/권한 정보 (sy_role)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private List<Map<String, Object>> roles = List.of();

    // ════════════════════════════════════════════════════════════════
    // [권한] 메뉴 정보 (sy_menu)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private List<Map<String, Object>> menus = List.of();

    // ════════════════════════════════════════════════════════════════
    // [시스템] 코드 정보 (sy_code_grp, sy_code)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private Map<String, Object> codes = Map.of();

    // ════════════════════════════════════════════════════════════════
    // [시스템] 속성 정보 (sy_prop)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private Map<String, Object> props = Map.of();

    // ════════════════════════════════════════════════════════════════
    // [추가] BO 앱 시스템 정보
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private AppInfo app = new AppInfo();

    // ═══════════════════════════════════════════════════════════════
    // Inner Classes
    // ═══════════════════════════════════════════════════════════════

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthInfo {
        private String accessToken;
        private String refreshToken;
        private Long accessExpiresIn;      // 초 단위
        private Long refreshExpiresIn;     // 초 단위
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
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

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppInfo {
        private String boSiteNo;          // BO 사이트 번호
        private String appVersion;        // 앱 버전
        private String lastUpdateDate;    // 마지막 업데이트 날짜
    }
}
