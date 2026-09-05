package com.shopjoy.ecBeBo.co.cm.service;

import com.shopjoy.ecBeBo.base.ec.dp.data.entity.*;
import com.shopjoy.ecBeBo.base.ec.dp.repository.*;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.*;
import com.shopjoy.ecBeBo.base.sy.repository.*;
import com.shopjoy.ecBeBo.co.auth.security.AuthPrincipal;
import com.shopjoy.ecBeBo.co.cm.constant.CmStoreConst;
import com.shopjoy.ecBeBo.co.cm.data.vo.*;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
@Transactional(readOnly = true)
public class CmAppStoreDataService {

    @Autowired
    private Environment environment;

    // ── 외부 SDK 키 — sy_prop(DB) 우선, application-{profile}.yml 폴백 ──
    // propKey 규칙: yml 경로 그대로 (예: app.auth.social.google-client-id)
    // 소셜 로그인
    @Value("${app.auth.social.google-client-id:}") private String googleClientId;
    @Value("${app.auth.social.kakao-js-key:}") private String kakaoJsKey;
    @Value("${app.auth.social.naver-client-id:}") private String naverClientId;
    @Value("${app.auth.social.naver-callback-url:}") private String naverCallbackUrl;
    // 결제
    @Value("${app.pay.toss.widget-client-key:}") private String tossClientKey;
    @Value("${app.pay.kakaopay.cid:}") private String kakaoPayCidYml;
    @Value("${app.pay.naverpay.client-id:}") private String naverPayClientIdYml;
    // 지도
    @Value("${app.map.kakao-js-key:}") private String kakaoMapJsKey;
    @Value("${app.map.naver-map-client-id:}") private String naverMapClientId;
    @Value("${app.map.google-api-key:}") private String googleMapApiKeyYml;

    private final MbMemberRepository memberRepository;
    private final SyUserRepository syUserRepository;
    private final SyRoleRepository syRoleRepository;
    private final SyMenuRepository syMenuRepository;
    private final SyCodeRepository syCodeRepository;
    private final SyDeptRepository syDeptRepository;
    private final SyPropRepository syPropRepository;
    private final SyRoleMenuRepository syRoleMenuRepository;
    private final SyUserRoleRepository syUserRoleRepository;
    private final SyVendorUserRoleRepository syVendorUserRoleRepository;
    private final SyVendorRepository syVendorRepository;
    private final DpUiRepository dpUiRepository;
    private final DpAreaRepository dpAreaRepository;
    private final DpPanelRepository dpPanelRepository;
    private final DpPanelItemRepository dpPanelItemRepository;
    private final DpWidgetRepository dpWidgetRepository;
    private final DpWidgetLibRepository dpWidgetLibRepository;
    private final SyPathRepository syPathRepository;

    // ════════════════════════════════════════════════════════════════════
    // 통합 메서드
    // ════════════════════════════════════════════════════════════════════

    /**
     * 통합 인증/앱 초기화 데이터 조회 - CmStoreConst 상수값으로 선택적 반환
     *
     * @param names CmStoreConst 상수값 ('^' 구분자로 선택, 예: "syAuth^syRoles^syMenus")
     * @param appTypeCd 사용자 타입 (BO: 관리자, FO: 회원)
     * @return 요청된 데이터만 포함된 Map
     */
    public Map<String, Object> getAuthData(String names, String appTypeCd) {
        AuthPrincipal authUser = com.shopjoy.ecBeBo.common.util.SecurityUtil.getAuthUser();
        java.util.List<String> requestedItems = CmUtil.parseNames(names);
        Map<String, Object> resultMap = new java.util.HashMap<>();

        Map<String, Object> reqParam = new java.util.HashMap<>();
        reqParam.put("names", names);
        reqParam.put("appTypeCd", appTypeCd);
        resultMap.put("reqParam", reqParam);

        if (requestedItems.contains(CmStoreConst.SY_AUTH)) {
            StoreAuth auth = getAuth(authUser, appTypeCd);
            resultMap.put(CmStoreConst.SY_AUTH, auth != null ? auth : StoreAuth.builder().build());
        }
        if (requestedItems.contains(CmStoreConst.SY_USER)) {
            Object userData = null;
            if (AuthPrincipal.BO.equals(appTypeCd)) {
                userData = getBoUser(authUser);
            } else if (AuthPrincipal.FO.equals(appTypeCd)) {
                userData = getFoUser(authUser);
            }
            resultMap.put(CmStoreConst.SY_USER, userData != null ? userData : new java.util.HashMap<>());
        }
        if (requestedItems.contains(CmStoreConst.SY_ROLES)) {
            List<StoreRole> roles = getRoles(authUser, appTypeCd);
            resultMap.put(CmStoreConst.SY_ROLES, roles != null ? roles : java.util.Collections.emptyList());
        }
        if (requestedItems.contains(CmStoreConst.SY_MENUS)) {
            List<StoreMenu> menus = getMenus(authUser);
            resultMap.put(CmStoreConst.SY_MENUS, menus != null ? menus : java.util.Collections.emptyList());
        }
        if (requestedItems.contains(CmStoreConst.SY_CODES)) {
            StoreCode codes = getCodes(authUser);
            resultMap.put(CmStoreConst.SY_CODES, codes != null ? codes : StoreCode.builder().codes(java.util.Collections.emptyList()).build());
        }
        if (requestedItems.contains(CmStoreConst.SY_PROPS)) {
            StoreProp props = getProps(authUser);
            resultMap.put(CmStoreConst.SY_PROPS, props != null ? props : StoreProp.builder().propsByKey(new java.util.HashMap<>()).build());
        }
        if (requestedItems.contains(CmStoreConst.DP_DISP)) {
            Map<String, Object> dispMap = new java.util.HashMap<>();
            StoreDispStruct dispStruc = getDispStruc(authUser);
            StoreDispData dispData = getDispData(authUser);
            StoreDispWidgets dispWidgets = getDispWidgets(authUser);
            dispMap.put(CmStoreConst.DP_DISP_STRUCTS, dispStruc != null ? dispStruc : StoreDispStruct.builder().uis(java.util.Collections.emptyList()).build());
            dispMap.put(CmStoreConst.DP_DISP_DATAS, dispData != null ? dispData : StoreDispData.builder().dataByArea(new java.util.HashMap<>()).build());
            dispMap.put(CmStoreConst.DP_DISP_WIDGETS, dispWidgets != null ? dispWidgets : StoreDispWidgets.builder().widgets(java.util.Collections.emptyList()).build());
            resultMap.put(CmStoreConst.DP_DISP, dispMap);
        }
        if (requestedItems.contains(CmStoreConst.SY_APP)) {
            StoreApp app = getApp(authUser, appTypeCd);
            resultMap.put(CmStoreConst.SY_APP, app != null ? app : StoreApp.builder().build());
        }
        if (requestedItems.contains(CmStoreConst.SY_PATHS) || requestedItems.isEmpty()) {
            List<Map<String, Object>> paths = getPaths();
            resultMap.put(CmStoreConst.SY_PATHS, Map.of("paths", paths));
        }

        return resultMap;
    }

    // ════════════════════════════════════════════════════════════════════
    // BO (Back Office) Methods
    // ════════════════════════════════════════════════════════════════════

    /**
     * 인증 정보 조회 - 토큰 정보 + 사용자 정보 반환
     * BO: StoreUser (관리자), FO: StoreMember (회원)
     */
    private StoreAuth getAuth(AuthPrincipal authUser, String appTypeCd) {
        if (authUser == null) {
            return StoreAuth.builder().build();
        }

        Object authUserInfo = null;
        if (AuthPrincipal.BO.equals(appTypeCd)) {
            authUserInfo = getBoUser(authUser);
        } else {
            authUserInfo = getFoUser(authUser);
        }

        // BO 전용: sy_user 기반 역할 목록 (FO는 빈 리스트)
        String rolesUserId = AuthPrincipal.BO.equals(appTypeCd) ? authUser.authId() : null;

        Map<String, Object> tempAuthInfo = new java.util.HashMap<>();
        tempAuthInfo.put("authUser-authId", authUser.authId());
        tempAuthInfo.put("authUser-appTypeCd", appTypeCd);
        tempAuthInfo.put("authUser-userId", authUser.userId());
        tempAuthInfo.put("authUser-roleId", authUser.roleId());
        tempAuthInfo.put("authUser-siteId", authUser.siteId());
        tempAuthInfo.put("authUser-memberId", authUser.memberId());
        tempAuthInfo.put("authUser-vendorId", authUser.vendorId());
        tempAuthInfo.put("authUser-roles", buildAuthRoles(rolesUserId));
        tempAuthInfo.put("authUser-isStaffYn", authUser.isStaffYn());
        tempAuthInfo.put("authUser-isAdminYn", authUser.isAdminYn());
        tempAuthInfo.put("authUser-loginTime", authUser.loginTime());
        tempAuthInfo.put("authUser-deptId", authUser.deptId());
        tempAuthInfo.put("authUser-memberGrade", authUser.memberGrade());
        String at = authUser.accessToken();
        String rt = authUser.refreshToken();
        tempAuthInfo.put("authUser-accessToken-tail", "..." + at.substring(Math.max(0, at.length() - 10)) + " (" + at.length() + ")");
        tempAuthInfo.put("authUser-refreshToken-tail", "..." + rt.substring(Math.max(0, rt.length() - 10)) + " (" + rt.length() + ")");

        return StoreAuth.builder()
                .accessToken(CmUtil.nvlStr(authUser.accessToken())) // 액세스 토큰
                .refreshToken(CmUtil.nvlStr(authUser.refreshToken())) // 리프레시 토큰
                .accessExpiresIn(3600L) // 액세스 토큰 만료시간(초)
                .refreshExpiresIn(604800L) // 리프레시 토큰 만료시간(초, 7일)
                .authUser(authUserInfo) // 사용자 정보
                .tempAuthInfo(tempAuthInfo) // 사용자 정보
                .build();
    }

    /**
     * 사용자 역할 목록 조회 - sy_user_role UNION sy_vendor_user_role (조건: authId)
     * 반환 형식: [{ roleTypeCd, authId, roleId, roleCode, roleNm, vendorId, vendorNm }]
     */
    private List<Map<String, Object>> buildAuthRoles(String authId) {
        if (authId == null) return java.util.Collections.emptyList();

        // sy_role :: select list :: useYn=Y
        // [쿼리 메서드] 역할 (권한그룹) 전체/다건 조회
        Map<String, SyRole> roleMap = syRoleRepository.findAll().stream()
                .filter(r -> "Y".equals(r.getUseYn()))
                .collect(Collectors.toMap(SyRole::getRoleId, r -> r, (a, b) -> a));

        // sy_vendor :: select list ::
        // [쿼리 메서드] 판매/배송업체 (사업체/법인) 전체/다건 조회
        Map<String, String> vendorNmMap = syVendorRepository.findAll().stream()
                .collect(Collectors.toMap(
                        v -> v.getVendorId(),
                        v -> CmUtil.nvlStr(v.getVendorNm()),
                        (a, b) -> a));

        List<Map<String, Object>> result = new java.util.ArrayList<>();

        // sy_user_role :: select list :: authId
        SyUserRoleDto.Request userRoleReq = new SyUserRoleDto.Request();
        userRoleReq.setUserId(authId);
        // [QueryDSL] 관리자 사용자-역할 매핑 (N:M) 목록 조회
        syUserRoleRepository.selectList(userRoleReq).forEach(ur -> {
            SyRole role = roleMap.get(ur.getRoleId());
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("roleTypeCd", "user_role");
            row.put("authId", ur.getUserId());
            row.put("roleId", ur.getRoleId());
            row.put("roleCode", role != null ? role.getRoleCode() : null);
            row.put("roleNm",   role != null ? role.getRoleNm()   : null);
            row.put("vendorId", null);
            row.put("vendorNm", null);
            result.add(row);
        });

        // sy_vendor_user_role :: select list :: authId
        SyVendorUserRoleDto.Request vendorUserRoleReq = new SyVendorUserRoleDto.Request();
        vendorUserRoleReq.setUserId(authId);
        // [QueryDSL] 업체 사용자 역할 연결 목록 조회
        syVendorUserRoleRepository.selectList(vendorUserRoleReq).forEach(vur -> {
            SyRole role = roleMap.get(vur.getRoleId());
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("roleTypeCd", "vendor_user_role");
            row.put("authId", vur.getUserId());
            row.put("roleId", vur.getRoleId());
            row.put("roleCode", role != null ? role.getRoleCode() : null);
            row.put("roleNm",   role != null ? role.getRoleNm()   : null);
            row.put("vendorId", vur.getVendorId());
            row.put("vendorNm", vendorNmMap.getOrDefault(vur.getVendorId(), null));
            result.add(row);
        });

        return result;
    }

    /**
     * 관리자 정보 조회 - BO: sy_user(관리자)
     */
    private StoreUser getBoUser(AuthPrincipal authUser) {
        if (authUser == null || authUser.authId() == null) {
            return StoreUser.builder().build();
        }

        // sy_user :: select one :: authId
        // [쿼리 메서드] 관리자 사용자 단건 조회
        SyUser user = syUserRepository.findById(authUser.authId()).orElse(null);
        if (user == null) {
            return StoreUser.builder().build();
        }

        String deptNm = "";
        if (user.getDeptId() != null) {
            // sy_dept :: select one :: deptId
            // [쿼리 메서드] 부서 단건 조회
            SyDept dept = syDeptRepository.findById(user.getDeptId()).orElse(null);
            if (dept != null) {
                deptNm = dept.getDeptNm();
            }
        }

        String roleNm = "";
        if (user.getRoleId() != null) {
            // sy_role :: select one :: roleId
            // [쿼리 메서드] 역할 (권한그룹) 단건 조회
            SyRole role = syRoleRepository.findById(user.getRoleId()).orElse(null);
            if (role != null) {
                roleNm = role.getRoleNm();
            }
        }

        String vendorNm = "";
        if (authUser.vendorId() != null) {
            // sy_vendor :: select one :: vendorId
            // [쿼리 메서드] 판매/배송업체 (사업체/법인) 단건 조회
            SyVendor vendor = syVendorRepository.findById(authUser.vendorId()).orElse(null);
            if (vendor != null) {
                vendorNm = CmUtil.nvlStr(vendor.getVendorNm());
            }
        }

        return StoreUser.builder()
                .authId(user.getUserId()) // 인증 식별자 (BO = sy_user.user_id)
                .authNm(CmUtil.nvlStr(user.getUserNm())) // 인증 사용자명
                .userId(user.getUserId()) // 사용자ID
                .loginId(CmUtil.nvlStr(user.getLoginId())) // 로그인ID
                .userNm(CmUtil.nvlStr(user.getUserNm())) // 사용자명
                .userEmail(CmUtil.nvlStr(user.getUserEmail())) // 이메일
                .userHpNo(CmUtil.nvlStr(user.getUserPhone())) // 휴대폰
                .siteId("") // 사이트ID (sy_user에서 제거됨)
                .deptId(CmUtil.nvlStr(user.getDeptId())) // 부서ID
                .deptNm(deptNm) // 부서명
                .roleId(CmUtil.nvlStr(user.getRoleId())) // 역할ID
                .roleNm(roleNm) // 역할명
                .memberGradeCd("") // 회원등급 (관리자는 해당없음)
                .userStatusCd(CmUtil.nvlStr(user.getUserStatusCd(), "ACTIVE")) // 상태
                .appTypeCd(CmUtil.nvlStr(authUser.appTypeCd())) // 사용자타입
                .isAdminYn("N") // 관리자여부
                .vendorId(CmUtil.nvlStr(authUser.vendorId())) // 업체ID
                .vendorNm(vendorNm) // 업체명
                .loginSnsChannelCd("") // SNS로그인채널 (관리자는 해당없음)
                .boBookmarks("") // 즐겨찾기
                .build();
    }

    /**
     * 회원 정보 조회 - FO: ec_member(회원)
     */
    private StoreMember getFoUser(AuthPrincipal authUser) {
        if (authUser == null || authUser.authId() == null) {
            return StoreMember.builder().build();
        }

        // ec_member :: select one :: authId(memberId)
        // [쿼리 메서드] Member 단건 조회
        MbMember member = memberRepository.findById(authUser.authId()).orElse(null);
        if (member == null) {
            return StoreMember.builder().build();
        }

        return StoreMember.builder()
                .authId(member.getMemberId()) // 인증 식별자 (FO = ec_member.member_id)
                .authNm(CmUtil.nvlStr(member.getMemberNm())) // 인증 사용자명
                .memberId(member.getMemberId()) // 회원ID
                .memberEmail(member.getLoginId()) // 이메일(로그인ID)
                .memberNm(member.getMemberNm()) // 회원명
                .siteId("") // 사이트ID
                .appTypeCd(CmUtil.nvlStr(authUser.appTypeCd())) // 사용자타입
                .memberTypeCd("") // 회원유형
                .memberHpNo(CmUtil.nvlStr(member.getMemberPhone())) // 휴대폰
                .memberGrade(CmUtil.nvlStr(member.getGradeCd())) // 회원등급
                .memberStaffYn("N") // 직원여부
                .memberBirthDt(CmUtil.nvlStr(member.getBirthDate() != null ? member.getBirthDate().toString() : null)) // 생년월일
                .memberStatusCd(CmUtil.nvlStr(member.getMemberStatusCd())) // 상태
                .cartCount(0L) // 장바구니수
                .likeCount(0L) // 찜한상품수
                .build();
    }

    /**
     * 권한 정보 조회
     * BO/SO: sy_user_role(역할ID) + sy_vendor_user(업체ID) + sy_vendor(업체명) + sy_role(역할정보)
     * FO: 빈 리스트
     */
    private List<StoreRole> getRoles(AuthPrincipal authUser, String appTypeCd) {
        if (authUser == null) {
            return List.of();
        }

        Map<String, String> roleVendorMap = new java.util.HashMap<>();

        if (AuthPrincipal.BO.equals(appTypeCd) || AuthPrincipal.SO.equals(appTypeCd)) {
            // sy_user_role :: select list :: authId
            SyUserRoleDto.Request userRoleReq2 = new SyUserRoleDto.Request();
            userRoleReq2.setUserId(authUser.authId());
            // [QueryDSL] 관리자 사용자-역할 매핑 (N:M) 목록 조회
            syUserRoleRepository.selectList(userRoleReq2).forEach(ur ->
                roleVendorMap.put(ur.getRoleId(), null));

            // sy_vendor_user_role :: select list :: authId
            SyVendorUserRoleDto.Request vendorUserRoleReq2 = new SyVendorUserRoleDto.Request();
            vendorUserRoleReq2.setUserId(authUser.authId());
            // [QueryDSL] 업체 사용자 역할 연결 목록 조회
            syVendorUserRoleRepository.selectList(vendorUserRoleReq2).forEach(vur ->
                roleVendorMap.put(vur.getRoleId(), vur.getVendorId()));
        } else {
            return List.of();
        }

        return roleVendorMap.entrySet().stream()
                .map(entry -> {
                    // sy_role :: select one :: roleId, useYn=Y
                    // [쿼리 메서드] 역할 (권한그룹) 단건 조회
                    SyRole role = syRoleRepository.findById(entry.getKey()).orElse(null);
                    if (role == null || !"Y".equals(role.getUseYn())) return null;

                    String vendorNm = null;
                    if (entry.getValue() != null) {
                        // sy_vendor :: select one :: vendorId
                        // [쿼리 메서드] 판매/배송업체 (사업체/법인) 단건 조회
                        SyVendor vendor = syVendorRepository.findById(entry.getValue()).orElse(null);
                        if (vendor != null) {
                            vendorNm = vendor.getVendorNm();
                        }
                    }

                    return StoreRole.builder()
                            .roleId(role.getRoleId())
                            .roleNm(role.getRoleNm())
                            .roleCd(role.getRoleCode())
                            .roleSortOrd(String.valueOf(role.getSortOrd() != null ? role.getSortOrd() : 0))
                            .roleRemark(CmUtil.nvlStr(role.getRoleRemark()))
                            .vendorId(entry.getValue())
                            .vendorNm(vendorNm)
                            .regDate(role.getRegDate() != null ? role.getRegDate().toString() : null)
                            .modDate(role.getUpdDate() != null ? role.getUpdDate().toString() : null)
                            .build();
                })
                .filter(role -> role != null)
                .toList();
    }

    /**
     * 메뉴 정보 조회 - sy_role_menu, sy_menu + 상위 메뉴 포함
     */
    private List<StoreMenu> getMenus(AuthPrincipal authUser) {
        if (authUser == null || authUser.roleId() == null) {
            return List.of();
        }

        // sy_role_menu :: select list :: roleId
        // [쿼리 메서드] 역할-메뉴 권한 매핑 전체/다건 조회
        List<SyRoleMenu> roleMenus = syRoleMenuRepository.findAll().stream()
                .filter(rm -> rm.getRoleId().equals(authUser.roleId()))
                .toList();

        java.util.Set<String> menuIds = new java.util.HashSet<>();
        for (SyRoleMenu roleMenu : roleMenus) {
            menuIds.add(roleMenu.getMenuId());
            addParentMenus(roleMenu.getMenuId(), menuIds);
        }

        // sy_menu :: select one :: menuId, useYn=Y (반복)
        return menuIds.stream()
                // [쿼리 메서드] 메뉴 단건 조회
                .map(menuId -> syMenuRepository.findById(menuId).orElse(null))
                .filter(menu -> menu != null && "Y".equals(menu.getUseYn()))
                .map(menu -> {
                    int menuLevel = getMenuLevel(menu);
                    return StoreMenu.builder()
                            .menuId(menu.getMenuId()) // 메뉴ID
                            .menuNm(menu.getMenuNm()) // 메뉴명
                            .menuPath(CmUtil.nvlStr(menu.getMenuUrl())) // 메뉴경로
                            .parentMenuId(CmUtil.nvlStr(menu.getParentMenuId())) // 상위메뉴ID
                            .menuLevel(menuLevel) // 메뉴레벨(1,2,3...)
                            .menuSortOrd(String.valueOf(menu.getSortOrd() != null ? menu.getSortOrd() : 0)) // 정렬순서
                            .menuIconCd(CmUtil.nvlStr(menu.getIconClass())) // 아이콘코드
                            .menuStatusCd(CmUtil.nvlStr(menu.getUseYn(), "Y")) // 상태
                            .menuRemark(CmUtil.nvlStr(menu.getMenuRemark())) // 비고
                            .regDate(menu.getRegDate() != null ? menu.getRegDate().toString() : null) // 등록일시
                            .modDate(menu.getUpdDate() != null ? menu.getUpdDate().toString() : null) // 수정일시
                            .build();
                })
                .toList();
    }

    /** addParentMenus — 추가 */
    private void addParentMenus(String menuId, java.util.Set<String> menuIds) {
        // sy_menu :: select one :: menuId (재귀)
        // [쿼리 메서드] 메뉴 단건 조회
        SyMenu menu = syMenuRepository.findById(menuId).orElse(null);
        if (menu != null && menu.getParentMenuId() != null) {
            menuIds.add(menu.getParentMenuId());
            addParentMenus(menu.getParentMenuId(), menuIds);
        }
    }

    /** getMenuLevel — 조회 */
    private int getMenuLevel(SyMenu menu) {
        int level = 1;
        SyMenu parent = menu;
        while (parent.getParentMenuId() != null) {
            // sy_menu :: select one :: parentMenuId (재귀)
            // [쿼리 메서드] 메뉴 단건 조회
            parent = syMenuRepository.findById(parent.getParentMenuId()).orElse(null);
            if (parent == null) break;
            level++;
        }
        return level;
    }

    /**
     * 코드 정보 조회 - sy_code (공통코드, 그리드 형식)
     */
    private StoreCode getCodes(AuthPrincipal authUser) {
        java.util.List<StoreCode.CodeInfo> codes = new java.util.ArrayList<>();

        // sy_code :: select list :: useYn=Y (SyCodeDto.Item — codeGrp via JOIN)
        SyCodeDto.Request codeReq = new SyCodeDto.Request();
        codeReq.setUseYn("Y");
        // [QueryDSL] 공통코드 목록 조회
        syCodeRepository.selectList(codeReq)
                .forEach(code -> {
            StoreCode.CodeInfo codeInfo = StoreCode.CodeInfo.builder()
                    .codeGrp(code.getCodeGrp())
                    .codeId(code.getCodeId())
                    .codeNm(code.getCodeLabel())
                    .codeVal(CmUtil.nvlStr(code.getCodeValue()))
                    .codeSortOrd(String.valueOf(code.getSortOrd() != null ? code.getSortOrd() : 0))
                    .codeRemark(CmUtil.nvlStr(code.getCodeRemark()))
                    .useYn(CmUtil.nvlStr(code.getUseYn()))
                    .parentCodeValue(CmUtil.nvlStr(code.getParentCodeValue()))
                    .codeLevel(code.getCodeLevel() != null ? code.getCodeLevel() : 1)
                    .codeOpt1(CmUtil.nvlStr(code.getCodeOpt1()))
                    .build();

            codes.add(codeInfo);
        });

        return StoreCode.builder().codes(codes).build();
    }

    /**
     * 속성 정보 조회 - sy_prop (시스템속성)
     */
    private StoreProp getProps(AuthPrincipal authUser) {
        String[] activeProfs = environment.getActiveProfiles();
        String activeProf = (activeProfs != null && activeProfs.length > 0) ? activeProfs[0] : "-";
        // sy_prop :: select list :: useYn=Y, prop_profile 매칭
        // [쿼리 메서드] 프로퍼티 (환경설정/공통 파라미터) 전체/다건 조회
        Map<String, StoreProp.PropInfo> propsByKey = syPropRepository.findAll().stream()
                .filter(prop -> "Y".equals(prop.getUseYn())
                        && isPropProfileMatch(prop.getPropProfile(), activeProf))
                .collect(Collectors.toMap(
                        SyProp::getPropKey,
                        prop -> StoreProp.PropInfo.builder()
                                .propKey(prop.getPropKey())
                                .propVal(CmUtil.nvlStr(prop.getPropValue()))
                                .propNm(CmUtil.nvlStr(prop.getPropLabel()))
                                .propRemark(CmUtil.nvlStr(prop.getPropRemark()))
                                .build(),
                        (old, neu) -> neu
                ));
        return StoreProp.builder().propsByKey(propsByKey).build();
    }

    /**
     * 앱 정보 조회 - 버전, 사이트정보, 환경상태
     * active 값: spring.profiles.active 설정값 (dev, prod 등)
     */
    private StoreApp getApp(AuthPrincipal authUser, String appTypeCd) {
        String[] activeProfiles = environment.getActiveProfiles();
        String active = (activeProfiles != null && activeProfiles.length > 0) ? activeProfiles[0] : "-";

        // ── sy_prop DB 우선 → yml @Value 폴백 ──────────────────────────────
        // propKey = yml 경로 그대로 (예: app.auth.social.google-client-id)
        // propProfile 매칭: ^local^dev^ / ^prod^ / ^local^dev^prod^ / null(전체)
        final String currentProfile = active;
        // [쿼리 메서드] 프로퍼티 (환경설정/공통 파라미터) 전체/다건 조회
        Map<String, String> dbProps = syPropRepository.findAll().stream()
                .filter(p -> "Y".equals(p.getUseYn())
                        && p.getPropKey() != null
                        && p.getPropValue() != null && !p.getPropValue().isBlank()
                        && isPropProfileMatch(p.getPropProfile(), currentProfile))
                .collect(Collectors.toMap(SyProp::getPropKey, SyProp::getPropValue, (o, n) -> n));

        // helper: propKey(=yml 경로) 기준 DB 값 우선, 없으면 yml @Value 폴백
        java.util.function.BiFunction<String, String, String> resolve =
                (propKey, ymlVal) -> {
                    String v = dbProps.get(propKey);
                    return (v != null && !v.isBlank()) ? v : ymlVal;
                };

        // 소셜 SDK 키 — DB sy_prop 우선, yml @Value 폴백
        String resolvedGoogleClientId   = resolve.apply("app.auth.social.google-client-id",   this.googleClientId);
        String resolvedKakaoJsKey       = resolve.apply("app.auth.social.kakao-js-key",        this.kakaoJsKey);
        String resolvedNaverClientId    = resolve.apply("app.auth.social.naver-client-id",     this.naverClientId);
        String resolvedNaverCallbackUrl = resolve.apply("app.auth.social.naver-callback-url",  this.naverCallbackUrl);
        // 결제 SDK 키
        String resolvedTossClientKey    = resolve.apply("app.pay.toss.widget-client-key", this.tossClientKey);
        String resolvedKakaoPayCid      = resolve.apply("app.pay.kakaopay.cid",        this.kakaoPayCidYml);
        String resolvedNaverPayClientId = resolve.apply("app.pay.naverpay.client-id",  this.naverPayClientIdYml);
        // 지도 SDK 키
        String resolvedKakaoMapJsKey    = resolve.apply("app.map.kakao-js-key",        this.kakaoMapJsKey);
        String resolvedNaverMapClientId = resolve.apply("app.map.naver-map-client-id", this.naverMapClientId);
        String resolvedGoogleMapApiKey  = resolve.apply("app.map.google-api-key",      this.googleMapApiKeyYml);

        String facebookAppId    = "DEMO_FACEBOOK_APP_ID";
        String appleClientId    = "com.shopjoy.demo.signin";
        // 결제
        String tossClientKey    = resolvedTossClientKey;
        String kakaoPayCid      = resolvedKakaoPayCid.isEmpty()      ? "TC0ONETIME"              : resolvedKakaoPayCid;
        String naverPayClientId = resolvedNaverPayClientId;
        String inicisMid        = "INIpayTest";
        String kcpSiteCd        = "T0000";
        // 지도 (DB sy_prop 우선 → yml 폴백)
        String googleMapApiKey  = resolvedGoogleMapApiKey;
        // AWS
        String awsRegion        = "ap-northeast-2";
        String awsS3Bucket      = "shopjoy-demo-bucket";
        String awsS3PublicUrl   = "https://demo-cdn.shopjoy.example/";
        String awsCognitoIdentityPoolId = "ap-northeast-2:DEMO-COGNITO-POOL-ID";
        // 알림/메시징
        String kakaoAlimtalkSenderKey = "DEMO_ALIMTALK_SENDER_KEY";
        String nhnCloudSmsAppKey      = "DEMO_NHN_SMS_APP_KEY";
        String ncloudSensServiceId    = "ncp:sms:kr:DEMO:shopjoy";
        // 본인인증
        String niceClientId     = "DEMO_NICE_CLIENT_ID";
        String passClientId     = "DEMO_PASS_CLIENT_ID";
        // 보안/분석
        String recaptchaSiteKey = "6LcDEMO_RECAPTCHA_SITE_KEY";
        String gaTrackingId     = "G-DEMOXXXXXX";
        String naverAnalyticsId = "demo_naver_analytics_id";
        String facebookPixelId  = "0000000000000000";
        // 채팅/CS
        String channelTalkPluginKey = "demo-channeltalk-plugin-key";
        // 기타
        String daumPostcodeUrl  = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

        StoreApp.StoreAppBuilder b = StoreApp.builder()
                .appVersion("2.6.0")
                .lastUpdateDate(java.time.LocalDate.now().toString())
                .active(active)
                // 소셜 (DB sy_prop 우선 → yml 폴백)
                .googleClientId(resolvedGoogleClientId)
                .kakaoJsKey(resolvedKakaoJsKey)
                .naverClientId(resolvedNaverClientId)
                .naverCallbackUrl(resolvedNaverCallbackUrl)
                .facebookAppId(facebookAppId)
                .appleClientId(appleClientId)
                // 결제
                .tossClientKey(tossClientKey)
                .kakaoPayCid(kakaoPayCid)
                .naverPayClientId(naverPayClientId)
                .inicisMid(inicisMid)
                .kcpSiteCd(kcpSiteCd)
                // 지도 (DB sy_prop 우선 → yml 폴백)
                .naverMapClientId(resolvedNaverMapClientId)
                .kakaoMapJsKey(resolvedKakaoMapJsKey)
                .googleMapApiKey(googleMapApiKey)
                // AWS
                .awsRegion(awsRegion)
                .awsS3Bucket(awsS3Bucket)
                .awsS3PublicUrl(awsS3PublicUrl)
                .awsCognitoIdentityPoolId(awsCognitoIdentityPoolId)
                // 알림/메시징
                .kakaoAlimtalkSenderKey(kakaoAlimtalkSenderKey)
                .nhnCloudSmsAppKey(nhnCloudSmsAppKey)
                .ncloudSensServiceId(ncloudSensServiceId)
                // 본인인증
                .niceClientId(niceClientId)
                .passClientId(passClientId)
                // 보안/분석
                .recaptchaSiteKey(recaptchaSiteKey)
                .gaTrackingId(gaTrackingId)
                .naverAnalyticsId(naverAnalyticsId)
                .facebookPixelId(facebookPixelId)
                // 채팅/CS
                .channelTalkPluginKey(channelTalkPluginKey)
                // 기타
                .daumPostcodeUrl(daumPostcodeUrl);

        if (AuthPrincipal.BO.equals(appTypeCd)) {
            b.boSiteNo("01").foSiteNo("01");
        } else {
            b.foSiteNo(System.getProperty("fo.site.no", "01"));
        }
        return b.build();
    }


    /**
     * prop_profile 매칭 — 비어있으면 전체 환경 적용, 값이 있으면 현재 active profile 포함 여부 확인.
     * 형식: "^local^dev^prod^" (^ 구분자 멀티값)
     * 예) "^local^dev^" + active="dev"  → true
     *     "^prod^"      + active="dev"  → false
     *     null / ""     + active="dev"  → true (전체 적용)
     */
    private boolean isPropProfileMatch(String propProfile, String activeProfile) {
        if (propProfile == null || propProfile.isBlank()) return true;
        if (activeProfile == null || activeProfile.isBlank()) return true;
        return propProfile.contains("^" + activeProfile + "^");
    }

    /**
     * 전시 구조 조회 - dp_ui, dp_area, dp_panel, dp_panel_item (content 제외)
     */
    private StoreDispStruct getDispStruc(AuthPrincipal authUser) {
        // dp_ui :: select list :: (filtered by siteId, useYn)
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 전체/다건 조회
        List<DpUi> uis = dpUiRepository.findAll().stream()
                .filter(ui -> "Y".equals(ui.getUseYn()))
                .toList();

        List<StoreDispStruct.UiInfo> uiInfos = uis.stream()
                .map(ui -> {
                    // dp_area :: select list :: (filtered by uiId, useYn)
                    // [쿼리 메서드] 디스플레이 영역 전체/다건 조회
                    List<DpArea> areas = dpAreaRepository.findAll().stream()
                            .filter(area -> area.getUiId().equals(ui.getUiId()) && "Y".equals(area.getUseYn()))
                            .toList();

                    List<StoreDispStruct.UiInfo.AreaInfo> areaInfos = areas.stream()
                            .map(area -> {
                                // dp_panel :: select list :: (filtered by siteId, useYn)
                                // [쿼리 메서드] 디스플레이 패널 전체/다건 조회
                                List<DpPanel> panels = dpPanelRepository.findAll().stream()
                                        .filter(panel -> "Y".equals(panel.getUseYn()))
                                        .toList();

                                List<StoreDispStruct.UiInfo.AreaInfo.PanelInfo> panelInfos = panels.stream()
                                        .map(panel -> {
                                            // dp_panel_item :: select list :: (filtered by panelId)
                                            // [쿼리 메서드] 디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성) 전체/다건 조회
                                            List<DpPanelItem> items = dpPanelItemRepository.findAll().stream()
                                                    .filter(item -> item.getPanelId().equals(panel.getPanelId()))
                                                    .toList();

                                            List<StoreDispStruct.WidgetInfo> widgets = items.stream()
                                                    .map(item -> StoreDispStruct.WidgetInfo.builder()
                                                            .widgetId(item.getPanelItemId())
                                                            .widgetNm(CmUtil.nvlStr(item.getWidgetTitle()))
                                                            .widgetTypeCd(CmUtil.nvlStr(item.getWidgetTypeCd()))
                                                            .widgetStatusCd("ACTIVE")
                                                            .widgetSortOrd(String.valueOf(item.getSortOrd() != null ? item.getSortOrd() : 0))
                                                            .build())
                                                    .toList();

                                            return StoreDispStruct.UiInfo.AreaInfo.PanelInfo.builder()
                                                    .panelId(panel.getPanelId())
                                                    .panelNm(panel.getPanelNm())
                                                    .panelStatusCd(CmUtil.nvlStr(panel.getDispPanelStatusCd(), "ACTIVE"))
                                                    .panelSortOrd(String.valueOf(0))
                                                    .widgets(widgets)
                                                    .build();
                                        })
                                        .toList();

                                return StoreDispStruct.UiInfo.AreaInfo.builder()
                                        .areaId(area.getAreaId())
                                        .areaNm(area.getAreaNm())
                                        .areaStatusCd("ACTIVE")
                                        .areaSortOrd(String.valueOf(0))
                                        .panels(panelInfos)
                                        .build();
                            })
                            .toList();

                    return StoreDispStruct.UiInfo.builder()
                            .uiId(ui.getUiId())
                            .uiNm(ui.getUiNm())
                            .uiStatusCd("ACTIVE")
                            .uiSortOrd(String.valueOf(ui.getSortOrd() != null ? ui.getSortOrd() : 0))
                            .areas(areaInfos)
                            .build();
                })
                .toList();

        return StoreDispStruct.builder().uis(uiInfos).build();
    }

    /**
     * 전시 데이터 조회 - dp_panel_item content + dp_widget_lib (참조일경우)
     */
    private StoreDispData getDispData(AuthPrincipal authUser) {
        Map<String, Object> dataByArea = new java.util.HashMap<>();

        // dp_ui :: select list :: (filtered by siteId, useYn)
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 전체/다건 조회
        List<DpUi> uis = dpUiRepository.findAll().stream()
                .filter(ui -> "Y".equals(ui.getUseYn()))
                .toList();

        for (DpUi ui : uis) {
            // dp_area :: select list :: (filtered by uiId, useYn)
            // [쿼리 메서드] 디스플레이 영역 전체/다건 조회
            List<DpArea> areas = dpAreaRepository.findAll().stream()
                    .filter(area -> area.getUiId().equals(ui.getUiId()) && "Y".equals(area.getUseYn()))
                    .toList();

            for (DpArea area : areas) {
                Map<String, Object> areaData = new java.util.HashMap<>();
                // dp_panel :: select list :: (filtered by siteId, useYn)
                // [쿼리 메서드] 디스플레이 패널 전체/다건 조회
                List<DpPanel> panels = dpPanelRepository.findAll().stream()
                        .filter(panel -> "Y".equals(panel.getUseYn()))
                        .toList();

                List<Map<String, Object>> panelDataList = new java.util.ArrayList<>();
                for (DpPanel panel : panels) {
                    // dp_panel_item :: select list :: (filtered by panelId)
                    // [쿼리 메서드] 디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성) 전체/다건 조회
                    List<DpPanelItem> items = dpPanelItemRepository.findAll().stream()
                            .filter(item -> item.getPanelId().equals(panel.getPanelId()))
                            .toList();

                    List<Map<String, Object>> widgetDataList = new java.util.ArrayList<>();
                    for (DpPanelItem item : items) {
                        Map<String, Object> widgetData = new java.util.HashMap<>();
                        widgetData.put("widgetId", item.getPanelItemId()); // 위젯ID
                        widgetData.put("widgetTypeCd", CmUtil.nvlStr(item.getWidgetTypeCd())); // 위젯타입
                        widgetData.put("widgetTitle", CmUtil.nvlStr(item.getWidgetTitle())); // 위젯제목

                        String content = CmUtil.nvlStr(item.getWidgetContent()); // 위젯컨텐츠
                        if ("Y".equals(item.getWidgetLibRefYn()) && item.getWidgetLibId() != null) {
                            // dp_widget_lib :: select one :: widgetLibId
                            // [쿼리 메서드] 디스플레이 위젯 라이브러리 단건 조회
                            DpWidgetLib widgetLib = dpWidgetLibRepository.findById(item.getWidgetLibId()).orElse(null);
                            if (widgetLib != null) {
                                content = CmUtil.nvlStr(widgetLib.getWidgetLibDesc()); // 라이브러리참조시 라이브러리컨텐츠
                            }
                        }
                        widgetData.put("content", content); // 최종컨텐츠
                        widgetDataList.add(widgetData);
                    }

                    Map<String, Object> panelData = new java.util.HashMap<>();
                    panelData.put("panelId", panel.getPanelId()); // 패널ID
                    panelData.put("panelNm", panel.getPanelNm()); // 패널명
                    panelData.put("widgets", widgetDataList); // 위젯목록
                    panelDataList.add(panelData);
                }

                areaData.put("areaId", area.getAreaId()); // 영역ID
                areaData.put("areaNm", area.getAreaNm()); // 영역명
                areaData.put("panels", panelDataList); // 패널목록
                dataByArea.put(area.getAreaId(), areaData);
            }
        }

        return StoreDispData.builder().dataByArea(dataByArea).build();
    }

    /**
     * 표시경로 목록 조회 - sy_path (useYn=Y 전체)
     */
    private List<Map<String, Object>> getPaths() {
        // [쿼리 메서드] 경로 (업무별 트리) 전체/다건 조회
        return syPathRepository.findAll().stream()
                .filter(p -> "Y".equals(p.getUseYn()))
                .sorted(java.util.Comparator.comparing(SyPath::getSortOrd, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(p -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("pathId", p.getPathId());
                    m.put("bizCd", p.getBizCd());
                    m.put("parentPathId", p.getParentPathId());
                    m.put("pathLabel", p.getPathLabel());
                    m.put("sortOrd", p.getSortOrd());
                    m.put("useYn", p.getUseYn());
                    m.put("pathRemark", p.getPathRemark());
                    return m;
                })
                .collect(Collectors.toList());
    }

    /**
     * 전시 위젯 목록 조회 - dp_widget (유효한 위젯 목록, 참조형식이면 dp_widget_lib content 포함)
     */
    private StoreDispWidgets getDispWidgets(AuthPrincipal authUser) {
        // dp_widget :: select list :: (filtered by useYn)
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 전체/다건 조회
        List<DpWidget> widgets = dpWidgetRepository.findAll().stream()
                .filter(widget -> "Y".equals(widget.getUseYn()))
                .toList();

        List<StoreDispWidgets.WidgetInfo> widgetInfos = widgets.stream()
                .map(widget -> {
                    String content = CmUtil.nvlStr(widget.getWidgetContent()); // 위젯 자체 content
                    // 참조형식(widgetLibRefYn='Y')이면 dp_widget_lib에서 content 조회
                    if ("Y".equals(widget.getWidgetLibRefYn()) && widget.getWidgetLibId() != null) {
                        // dp_widget_lib :: select one :: widgetLibId
                        // [쿼리 메서드] 디스플레이 위젯 라이브러리 단건 조회
                        DpWidgetLib widgetLib = dpWidgetLibRepository.findById(widget.getWidgetLibId()).orElse(null);
                        if (widgetLib != null) {
                            content = CmUtil.nvlStr(widgetLib.getWidgetLibDesc()); // 라이브러리 content로 대체
                        }
                    }

                    return StoreDispWidgets.WidgetInfo.builder()
                            .widgetLibId(widget.getWidgetLibId()) // 위젯라이브러리ID (참조시에만)
                            .widgetLibNm(widget.getWidgetNm()) // 위젯명
                            .widgetTypeCd(CmUtil.nvlStr(widget.getWidgetTypeCd())) // 위젯타입코드
                            .widgetLibDesc(content) // 위젯 content (참조형식이면 라이브러리 content)
                            .widgetLibStatusCd(CmUtil.nvlStr(widget.getUseYn(), "Y")) // 위젯상태코드
                            .widgetLibSortOrd(String.valueOf(widget.getSortOrd() != null ? widget.getSortOrd() : 0)) // 정렬순서
                            .usageCount("") // 사용횟수
                            .regDate(widget.getRegDate() != null ? widget.getRegDate().toString() : null) // 등록일시
                            .modDate(widget.getUpdDate() != null ? widget.getUpdDate().toString() : null) // 수정일시
                            .build();
                })
                .toList();

        return StoreDispWidgets.builder().widgets(widgetInfos).build();
    }


}
