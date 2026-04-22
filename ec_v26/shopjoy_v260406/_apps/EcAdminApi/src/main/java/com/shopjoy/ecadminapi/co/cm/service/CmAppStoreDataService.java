package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreAuthInfo;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreCodeData;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreMenuInfo;
import com.shopjoy.ecadminapi.co.cm.data.vo.StorePropData;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreRoleInfo;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreAppInfo;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreUserInfo;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreMemberInfo;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreDispData;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreDispStructure;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 애플리케이션 Store 데이터 Service (BO/FO 통합)
 * - BO (Back Office): 관리자 애플리케이션 데이터
 * - FO (Front Office): 사용자 애플리케이션 데이터
 * - 로그인 후 필요한 store별 데이터를 개별 조회
 *
 * @author ShopJoy
 */
@Service
@RequiredArgsConstructor
public class CmAppStoreDataService {

    private final MbMemberRepository memberRepository;

    // ════════════════════════════════════════════════════════════════════
    // BO (Back Office) Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * BO: 인증 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreAuthInfo getBoAuth() {
        return buildAuthInfo();
    }

    /**
     * BO: 관리자 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreUserInfo getBoUser() {
        String userId = getCurrentUserId();
        return buildBoUserInfo(userId);
    }

    /**
     * BO: 권한 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreRoleInfo> getBoRole() {
        return buildRoles();
    }

    /**
     * BO: 메뉴 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreMenuInfo> getBoMenu() {
        return buildMenus();
    }

    /**
     * BO: 코드 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreCodeData getBoCode() {
        return buildCodes();
    }

    /**
     * BO: 속성 정보 조회
     */
    @Transactional(readOnly = true)
    public StorePropData getBoProps() {
        return buildProps();
    }

    /**
     * BO: 앱 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreAppInfo getBoApp() {
        return buildBoAppInfo();
    }

    // ════════════════════════════════════════════════════════════════════
    // FO (Front Office) Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * FO: 인증 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreAuthInfo getFoAuth() {
        return buildAuthInfo();
    }

    /**
     * FO: 회원 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreMemberInfo getFoUser() {
        String memberId = getCurrentMemberId();
        MbMember member = null;
        if (memberId != null) {
            member = memberRepository.findById(memberId).orElse(null);
        }
        return buildFoMemberInfo(member);
    }

    /**
     * FO: 권한 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreRoleInfo> getFoRole() {
        return buildRoles();
    }

    /**
     * FO: 메뉴 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreMenuInfo> getFoMenu() {
        return buildMenus();
    }

    /**
     * FO: 코드 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreCodeData getFoCode() {
        return buildCodes();
    }

    /**
     * FO: 속성 정보 조회
     */
    @Transactional(readOnly = true)
    public StorePropData getFoProps() {
        return buildProps();
    }

    /**
     * FO: 전시 구조 조회
     */
    @Transactional(readOnly = true)
    public StoreDispStructure getFoDispStruc() {
        return buildDispStruc();
    }

    /**
     * FO: 전시 데이터 조회
     */
    @Transactional(readOnly = true)
    public StoreDispData getFoDispData() {
        return buildDispData();
    }

    /**
     * FO: 앱 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreAppInfo getFoApp() {
        return buildFoAppInfo();
    }

    // ════════════════════════════════════════════════════════════════════
    // Common Builder Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * 토큰 정보 생성
     */
    private StoreAuthInfo buildAuthInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return StoreAuthInfo.builder().build();
        }
        return StoreAuthInfo.builder()
                .accessToken("")
                .refreshToken("")
                .accessExpiresIn(3600L)
                .refreshExpiresIn(604800L)
                .build();
    }

    /**
     * 권한 정보 생성
     */
    private List<StoreRoleInfo> buildRoles() {
        return List.of();
    }

    /**
     * 메뉴 정보 생성
     */
    private List<StoreMenuInfo> buildMenus() {
        return List.of();
    }

    /**
     * 코드 정보 생성
     */
    private StoreCodeData buildCodes() {
        return StoreCodeData.builder().build();
    }

    /**
     * 속성 정보 생성
     */
    private StorePropData buildProps() {
        return StorePropData.builder().build();
    }

    /**
     * 전시 구조 생성
     */
    private StoreDispStructure buildDispStruc() {
        return StoreDispStructure.builder().build();
    }

    /**
     * 전시 데이터 생성
     */
    private StoreDispData buildDispData() {
        return StoreDispData.builder().build();
    }

    // ════════════════════════════════════════════════════════════════════
    // BO Builder Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * BO 사용자(관리자) 정보 생성
     */
    private StoreUserInfo buildBoUserInfo(String userId) {
        return StoreUserInfo.builder()
                .userId(userId)
                .userName("")
                .userEmail("")
                .userHpNo("")
                .deptId("")
                .deptNm("")
                .roleId("")
                .roleNm("")
                .userStatusCd("ACTIVE")
                .isAdminYn("N")
                .companyId("")
                .companyNm("")
                .boBookmarks("")
                .build();
    }

    /**
     * BO 앱 정보 생성
     */
    private StoreAppInfo buildBoAppInfo() {
        return StoreAppInfo.builder()
                .boSiteNo("01")
                .foSiteNo("01")
                .appVersion("2.6.0")
                .lastUpdateDate(java.time.LocalDate.now().toString())
                .build();
    }

    // ════════════════════════════════════════════════════════════════════
    // FO Builder Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * FO 회원 정보 생성
     */
    private StoreMemberInfo buildFoMemberInfo(MbMember member) {
        if (member == null) {
            return StoreMemberInfo.builder().build();
        }
        return StoreMemberInfo.builder()
                .memberId(member.getMemberId())
                .memberEmail(member.getLoginId())
                .memberNm(member.getMemberNm())
                .siteId(member.getSiteId() != null ? member.getSiteId() : "")
                .memberTypeCd("")
                .memberHpNo(member.getMemberPhone() != null ? member.getMemberPhone() : "")
                .memberGrade(member.getGradeCd() != null ? member.getGradeCd() : "")
                .memberStaffYn("N")
                .memberBirthDt(member.getBirthDate() != null ? member.getBirthDate().toString() : "")
                .memberStatusCd(member.getMemberStatusCd() != null ? member.getMemberStatusCd() : "")
                .cartCount(0L)
                .likeCount(0L)
                .build();
    }

    /**
     * FO 앱 정보 생성
     */
    private StoreAppInfo buildFoAppInfo() {
        return StoreAppInfo.builder()
                .foSiteNo(System.getProperty("fo.site.no", "01"))
                .appVersion("2.6.0")
                .lastUpdateDate(java.time.LocalDate.now().toString())
                .build();
    }

    // ════════════════════════════════════════════════════════════════════
    // Helper Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * 현재 로그인 BO 사용자 ID 추출
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
     * 현재 로그인 FO 사용자(회원) ID 추출
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

}
