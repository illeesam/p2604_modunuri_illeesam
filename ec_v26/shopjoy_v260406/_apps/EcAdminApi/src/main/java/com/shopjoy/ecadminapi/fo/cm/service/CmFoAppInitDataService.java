package com.shopjoy.ecadminapi.fo.cm.service;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.fo.cm.data.vo.FoAppInitDataRes;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * FO (Front Office) 애플리케이션 초기화 데이터 Service
 * - 로그인 후 필요한 모든 초기화 데이터를 통합으로 조회
 * - 토큰, 사용자, 권한, 메뉴, 코드, 전시 정보 제공
 * - localStorage 및 Pinia store 동기화 데이터 포함
 *
 * @author ShopJoy
 */
@Service
@RequiredArgsConstructor
public class CmFoAppInitDataService {

    private final MbMemberRepository memberRepository;

    /**
     * FO 애플리케이션 초기화 데이터 조회
     *
     * @param names 조회할 항목 ('^' 구분자)
     *              예: "auth^user^role^menu" → 이 4개 항목만 반환
     *              빈 값 → 모든 항목 반환
     * @return FoAppInitDataRes 초기화 데이터
     */
    @Transactional(readOnly = true)
    public FoAppInitDataRes getFoAppInitData(String names) {
        // ── 현재 로그인 사용자 ID 추출 ──
        String memberId = getCurrentMemberId();

        // ── 조회할 항목 결정 ──
        Set<String> requestedNames = parseNames(names);
        boolean getAll = requestedNames.isEmpty();

        // ── 기본 응답 빌더 생성 ──
        FoAppInitDataRes.FoAppInitDataResBuilder builder = FoAppInitDataRes.builder();

        // ── 로그인 사용자 조회 ──
        MbMember member = memberRepository.findById(memberId)
                .orElse(null);

        // ── 각 항목별 조회 ──
        if (getAll || requestedNames.contains("auth")) {
            builder.auth(buildAuthInfo()); // 인증 정보 (토큰)
        }

        if (getAll || requestedNames.contains("user")) {
            builder.member(buildMemberInfo(member)); // 회원 정보
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

        if (getAll || requestedNames.contains("disp-struc")) {
            builder.dispStruc(buildDispStruc()); // 전시 구조
        }

        if (getAll || requestedNames.contains("disp-data")) {
            builder.dispData(buildDispData()); // 전시 데이터
        }

        if (getAll || requestedNames.contains("app")) {
            builder.app(buildAppInfo()); // 앱 정보
        }

        return builder.build();
    }

    /**
     * 현재 로그인 사용자 ID 추출
     */
    private String getCurrentMemberId() {
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
    private FoAppInitDataRes.AuthInfo buildAuthInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return FoAppInitDataRes.AuthInfo.builder().build();
        }

        // 실제 구현에서는 JWT 토큰에서 만료시간 추출
        return FoAppInitDataRes.AuthInfo.builder()
                .accessToken("")  // Controller에서 응답하기 전에 token 주입
                .refreshToken("") // Controller에서 응답하기 전에 token 주입
                .accessExpiresIn(3600L)   // 1시간 (실제는 JWT 정보에서 추출)
                .refreshExpiresIn(604800L) // 7일 (실제는 JWT 정보에서 추출)
                .build();
    }

    /**
     * 회원 정보 생성
     */
    private FoAppInitDataRes.MemberInfo buildMemberInfo(MbMember member) {
        if (member == null) {
            return FoAppInitDataRes.MemberInfo.builder().build();
        }

        return FoAppInitDataRes.MemberInfo.builder()
                .memberId(member.getMemberId())
                .memberEmail(member.getMemberEmail())
                .memberNm(member.getMemberNm())
                .siteId(member.getSiteId() != null ? member.getSiteId() : "")
                .memberTypeCd("")  // mb_member 테이블에 memberTypeCd 필드 없음
                .memberHpNo(member.getMemberPhone() != null ? member.getMemberPhone() : "")
                .memberGrade(member.getGradeCd() != null ? member.getGradeCd() : "")
                .memberStaffYn("N")  // mb_member 테이블에 memberStaffYn 필드 없음
                .memberBirthDt(member.getBirthDate() != null ? member.getBirthDate().toString() : "")
                .memberStatusCd(member.getMemberStatusCd() != null ? member.getMemberStatusCd() : "")
                .cartCount(0L)      // 실제 구현에서는 DB에서 조회
                .likeCount(0L)      // 실제 구현에서는 DB에서 조회
                .build();
    }

    /**
     * 권한 정보 생성 (Pinia store 구조만, 데이터 없음)
     */
    private java.util.List<java.util.Map<String, Object>> buildRoles() {
        return java.util.List.of();
    }

    /**
     * 메뉴 정보 생성 (Pinia store 구조만, 데이터 없음)
     */
    private java.util.List<java.util.Map<String, Object>> buildMenus() {
        return java.util.List.of();
    }

    /**
     * 코드 정보 생성 (sy_code)
     */
    private java.util.Map<String, Object> buildCodes() {
        return java.util.Map.of();
    }

    /**
     * 속성 정보 생성 (sy_prop)
     */
    private java.util.Map<String, Object> buildProps() {
        return java.util.Map.of();
    }

    /**
     * 전시 구조 생성
     */
    private java.util.Map<String, Object> buildDispStruc() {
        return java.util.Map.of();
    }

    /**
     * 전시 데이터 생성
     */
    private java.util.Map<String, Object> buildDispData() {
        return java.util.Map.of();
    }

    /**
     * 앱 정보 생성
     */
    private FoAppInitDataRes.AppInfo buildAppInfo() {
        return FoAppInitDataRes.AppInfo.builder()
                .foSiteNo(System.getProperty("fo.site.no", "01"))
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
