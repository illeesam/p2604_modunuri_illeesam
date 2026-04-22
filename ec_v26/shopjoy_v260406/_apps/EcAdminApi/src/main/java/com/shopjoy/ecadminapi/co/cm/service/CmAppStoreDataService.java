package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreAuth;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreCode;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreMenu;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreProp;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreRole;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreApp;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreUser;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreMember;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreDispData;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreDispStruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    public StoreAuth getBoAuth(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildAuthInfo();
    }

    /**
     * BO: 관리자 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreUser getBoUser(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildBoUserInfo(userId);
    }

    /**
     * BO: 권한 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreRole> getBoRole(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildRoles();
    }

    /**
     * BO: 메뉴 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreMenu> getBoMenu(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildMenus();
    }

    /**
     * BO: 코드 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreCode getBoCode(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildCodes();
    }

    /**
     * BO: 속성 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreProp getBoProps(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildProps();
    }

    /**
     * BO: 앱 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreApp getBoApp(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildBoAppInfo();
    }

    // ════════════════════════════════════════════════════════════════════
    // FO (Front Office) Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * FO: 인증 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreAuth getFoAuth(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildAuthInfo();
    }

    /**
     * FO: 회원 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreMember getFoUser(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
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
    public List<StoreRole> getFoRole(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildRoles();
    }

    /**
     * FO: 메뉴 정보 조회
     */
    @Transactional(readOnly = true)
    public List<StoreMenu> getFoMenu(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildMenus();
    }

    /**
     * FO: 코드 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreCode getFoCode(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildCodes();
    }

    /**
     * FO: 속성 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreProp getFoProps(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildProps();
    }

    /**
     * FO: 전시 구조 조회
     */
    @Transactional(readOnly = true)
    public StoreDispStruct getFoDispStruc(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildDispStruc();
    }

    /**
     * FO: 전시 데이터 조회
     */
    @Transactional(readOnly = true)
    public StoreDispData getFoDispData(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildDispData();
    }

    /**
     * FO: 앱 정보 조회
     */
    @Transactional(readOnly = true)
    public StoreApp getFoApp(String siteId, String userTypeCd, String userId, String roleId, boolean isLogin, boolean isAdmin) {
        return buildFoAppInfo();
    }

    // ════════════════════════════════════════════════════════════════════
    // Common Builder Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * 토큰 정보 생성
     */
    private StoreAuth buildAuthInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return StoreAuth.builder().build();
        }
        return StoreAuth.builder()
                .accessToken("")
                .refreshToken("")
                .accessExpiresIn(3600L)
                .refreshExpiresIn(604800L)
                .build();
    }

    /**
     * 권한 정보 생성
     */
    private List<StoreRole> buildRoles() {
        return List.of();
    }

    /**
     * 메뉴 정보 생성
     */
    private List<StoreMenu> buildMenus() {
        return List.of();
    }

    /**
     * 코드 정보 생성
     */
    private StoreCode buildCodes() {
        return StoreCode.builder().build();
    }

    /**
     * 속성 정보 생성
     */
    private StoreProp buildProps() {
        return StoreProp.builder().build();
    }

    /**
     * 전시 구조 생성
     */
    private StoreDispStruct buildDispStruc() {
        return StoreDispStruct.builder().build();
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
    private StoreUser buildBoUserInfo(String userId) {
        return StoreUser.builder()
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
    private StoreApp buildBoAppInfo() {
        return StoreApp.builder()
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
    private StoreMember buildFoMemberInfo(MbMember member) {
        if (member == null) {
            return StoreMember.builder().build();
        }
        return StoreMember.builder()
                .memberId(member.getMemberId())
                .memberEmail(member.getLoginId())
                .memberNm(member.getMemberNm())
                .siteId(CmUtil.nvl(member.getSiteId()))
                .memberTypeCd("")
                .memberHpNo(CmUtil.nvl(member.getMemberPhone()))
                .memberGrade(CmUtil.nvl(member.getGradeCd()))
                .memberStaffYn("N")
                .memberBirthDt(member.getBirthDate() != null ? member.getBirthDate().toString() : "")
                .memberStatusCd(CmUtil.nvl(member.getMemberStatusCd()))
                .cartCount(0L)
                .likeCount(0L)
                .build();
    }

    /**
     * FO 앱 정보 생성
     */
    private StoreApp buildFoAppInfo() {
        return StoreApp.builder()
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
