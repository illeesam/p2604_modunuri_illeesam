package com.shopjoy.ecadminapi.fo.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * FO (Front Office) 애플리케이션 초기화 데이터 응답 VO
 * - 로그인 후 필요한 모든 초기화 데이터를 한 번에 조회
 * - localStorage와 Pinia store에 저장할 데이터 포함
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoAppInitDataRes {

    // ════════════════════════════════════════════════════════════════
    // [인증] 토큰 정보
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private AuthInfo auth = new AuthInfo();

    // ════════════════════════════════════════════════════════════════
    // [사용자] 회원 정보
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private MemberInfo member = new MemberInfo();

    // ════════════════════════════════════════════════════════════════
    // [권한] 역할/권한 정보 (Pinia store에만 저장, 빈 구조)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private List<Map<String, Object>> roles = List.of();

    // ════════════════════════════════════════════════════════════════
    // [권한] 메뉴 정보 (Pinia store에만 저장, 빈 구조)
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
    // [전시] 구조 정보 (ui, area, panel, widget, widgetLib 등)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private Map<String, Object> dispStruc = Map.of();

    // ════════════════════════════════════════════════════════════════
    // [전시] 데이터 정보 (ui, area, panel, widget, widgetLib 등)
    // ════════════════════════════════════════════════════════════════
    @Builder.Default
    private Map<String, Object> dispData = Map.of();

    // ════════════════════════════════════════════════════════════════
    // [추가] FO 앱 시스템 정보
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
    public static class MemberInfo {
        private String memberId;
        private String memberEmail;
        private String memberNm;
        private String siteId;
        private String memberTypeCd;      // 회원 타입 (일반, VIP 등)
        private String memberHpNo;        // 휴대폰 번호
        private String memberGrade;       // 회원등급
        private String memberStaffYn;     // 직원 여부 (Y/N)
        private String memberBirthDt;     // 생년월일
        private String memberStatusCd;    // 상태 (ACTIVE, DORMANT, SUSPENDED)
        private Long cartCount;           // 장바구니 수량
        private Long likeCount;           // 찜한 상품 수
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppInfo {
        private String foSiteNo;          // 현재 FO 사이트 번호 (01, 02, 03)
        private String appVersion;        // 앱 버전
        private String lastUpdateDate;    // 마지막 업데이트 날짜
    }
}
