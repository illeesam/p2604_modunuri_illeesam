package com.shopjoy.ecadminapi.bo.cm.service;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.bo.cm.data.vo.BoAppInitDataRes;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * BO (Back Office) 애플리케이션 초기화 데이터 Service
 * - 로그인 후 필요한 모든 초기화 데이터를 통합으로 조회
 * - 토큰, 사용자, 권한, 메뉴, 코드 정보 제공
 * - localStorage 및 Pinia store 동기화 데이터 포함
 *
 * @author ShopJoy
 */
@Service
@RequiredArgsConstructor
public class CmBoAppInitDataService {

    /**
     * BO 애플리케이션 초기화 데이터 조회
     *
     * @param names 조회할 항목 ('^' 구분자)
     *              예: "auth^user^role^menu" → 이 4개 항목만 반환
     *              빈 값 → 모든 항목 반환
     * @return BoAppInitDataRes 초기화 데이터
     */
    @Transactional(readOnly = true)
    public BoAppInitDataRes getBoAppInitData(String names) {
        // ── 현재 로그인 사용자 ID 추출 ──
        String userId = getCurrentUserId();

        // ── 조회할 항목 결정 ──
        Set<String> requestedNames = parseNames(names);
        boolean getAll = requestedNames.isEmpty();

        // ── 기본 응답 빌더 생성 ──
        BoAppInitDataRes.BoAppInitDataResBuilder builder = BoAppInitDataRes.builder();

        // ── 각 항목별 조회 ──
        if (getAll || requestedNames.contains("auth")) {
            builder.auth(buildAuthInfo()); // 인증 정보 (토큰)
        }

        if (getAll || requestedNames.contains("user")) {
            builder.user(buildUserInfo(userId)); // 관리자 정보
        }

        if (getAll || requestedNames.contains("role")) {
            builder.roles(buildRoles()); // 역할 정보
        }

        if (getAll || requestedNames.contains("menu")) {
            builder.menus(buildMenus()); // 메뉴 정보
        }

        if (getAll || requestedNames.contains("code")) {
            builder.codes(buildCodes()); // 공통 코드
        }

        if (getAll || requestedNames.contains("props")) {
            builder.props(buildProps()); // 시스템 속성
        }

        if (getAll || requestedNames.contains("app")) {
            builder.app(buildAppInfo()); // 앱 정보
        }

        return builder.build();
    }

    /**
     * 현재 로그인 사용자 ID 추출
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            Object principal = auth.getPrincipal();
            if (principal instanceof AuthPrincipal) {
                return ((AuthPrincipal) principal).userId();
            }
        }
        return null;
    }

    /**
     * 토큰 정보 생성
     */
    private BoAppInitDataRes.AuthInfo buildAuthInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return BoAppInitDataRes.AuthInfo.builder().build();
        }

        // 실제 구현에서는 JWT 토큰에서 만료시간 추출
        return BoAppInitDataRes.AuthInfo.builder()
                .accessToken("")  // Controller에서 응답하기 전에 token 주입
                .refreshToken("") // Controller에서 응답하기 전에 token 주입
                .accessExpiresIn(3600L)   // 1시간 (실제는 JWT 정보에서 추출)
                .refreshExpiresIn(604800L) // 7일 (실제는 JWT 정보에서 추출)
                .build();
    }

    /**
     * 사용자(관리자) 정보 생성
     */
    private BoAppInitDataRes.UserInfo buildUserInfo(String userId) {
        // 실제 구현에서는 sy_user 테이블에서 조회
        return BoAppInitDataRes.UserInfo.builder()
                .userId(userId)
                .userName("")                // 실제 DB에서 조회
                .userEmail("")               // 실제 DB에서 조회
                .userHpNo("")                // 실제 DB에서 조회
                .deptId("")                  // 실제 DB에서 조회
                .deptNm("")                  // 실제 DB에서 조회
                .roleId("")                  // 실제 DB에서 조회
                .roleNm("")                  // 실제 DB에서 조회
                .userStatusCd("ACTIVE")      // 실제 DB에서 조회
                .isAdminYn("N")              // 실제 DB에서 조회
                .companyId("")               // 실제 DB에서 조회
                .companyNm("")               // 실제 DB에서 조회
                .boBookmarks("")             // sy_user_bookmark에서 조회
                .build();
    }

    /**
     * 권한 정보 생성 (sy_role)
     */
    private java.util.List<java.util.Map<String, Object>> buildRoles() {
        // 실제 구현에서는 sy_role 테이블에서 userId의 권한 조회
        return java.util.List.of();
    }

    /**
     * 메뉴 정보 생성 (sy_menu)
     */
    private java.util.List<java.util.Map<String, Object>> buildMenus() {
        // 실제 구현에서는 sy_menu 테이블에서 userId의 메뉴 조회
        return java.util.List.of();
    }

    /**
     * 코드 정보 생성 (sy_code)
     */
    private java.util.Map<String, Object> buildCodes() {
        // 실제 구현에서는 sy_code 테이블에서 조회
        return java.util.Map.of();
    }

    /**
     * 속성 정보 생성 (sy_prop)
     */
    private java.util.Map<String, Object> buildProps() {
        // 실제 구현에서는 sy_prop 테이블에서 조회
        return java.util.Map.of();
    }

    /**
     * 앱 정보 생성
     */
    private BoAppInitDataRes.AppInfo buildAppInfo() {
        return BoAppInitDataRes.AppInfo.builder()
                .boSiteNo("01")
                .appVersion("2.6.0")
                .lastUpdateDate(java.time.LocalDate.now().toString())
                .build();
    }

    /**
     * names 파라미터 파싱
     * "auth^user^role^menu" → Set["auth", "user", "role", "menu"]
     */
    private Set<String> parseNames(String names) {
        if (names == null || names.trim().isEmpty()) {
            return new HashSet<>(); // 빈 Set = 모든 항목
        }
        return new HashSet<>(Arrays.asList(names.split("\\^")));
    }
}
