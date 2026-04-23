package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
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
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreDispWidgets;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRoleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelItemRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetLibRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
public class CmAppStoreDataService {

    @Autowired
    private Environment environment;

    private final MbMemberRepository memberRepository;
    private final SyUserRepository syUserRepository;
    private final SyRoleRepository syRoleRepository;
    private final SyMenuRepository syMenuRepository;
    private final SyCodeRepository syCodeRepository;
    private final SyDeptRepository syDeptRepository;
    private final SyPropRepository syPropRepository;
    private final SyRoleMenuRepository syRoleMenuRepository;
    private final SyUserRoleRepository syUserRoleRepository;
    private final SyVendorUserRepository syVendorUserRepository;
    private final SyVendorRepository syVendorRepository;
    private final DpUiRepository dpUiRepository;
    private final DpAreaRepository dpAreaRepository;
    private final DpPanelRepository dpPanelRepository;
    private final DpPanelItemRepository dpPanelItemRepository;
    private final DpWidgetRepository dpWidgetRepository;
    private final DpWidgetLibRepository dpWidgetLibRepository;

    // ════════════════════════════════════════════════════════════════════
    // 통합 메서드
    // ════════════════════════════════════════════════════════════════════

    /**
     * 통합 인증/앱 초기화 데이터 조회 - CmStoreConst 상수값으로 선택적 반환
     *
     * @param names CmStoreConst 상수값 ('^' 구분자로 선택, 예: "syAuth^syRoles^syMenus")
     * @return 요청된 데이터만 포함된 Map
     */
    public Map<String, Object> getAuthData(String names) {
        AuthPrincipal authUser = com.shopjoy.ecadminapi.common.util.SecurityUtil.getAuthUser();
        java.util.List<String> requestedItems = CmUtil.parseNames(names);
        Map<String, Object> resultMap = new java.util.HashMap<>();

        if (requestedItems.contains(CmStoreConst.SY_AUTH)) {
            StoreAuth auth = getAuth(authUser);
            resultMap.put(CmStoreConst.SY_AUTH, auth != null ? auth : StoreAuth.builder().build());
        }
        if (requestedItems.contains(CmStoreConst.SY_USER)) {
            Object userData = "BO".equals(authUser != null ? authUser.userTypeCd() : null) ? getBoUser(authUser) : getFoUser(authUser);
            resultMap.put(CmStoreConst.SY_USER, userData != null ? userData : new java.util.HashMap<>());
        }
        if (requestedItems.contains(CmStoreConst.SY_ROLES)) {
            List<StoreRole> roles = getRoles(authUser);
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
            StoreApp app = getApp(authUser);
            resultMap.put(CmStoreConst.SY_APP, app != null ? app : StoreApp.builder().build());
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
    private StoreAuth getAuth(AuthPrincipal authUser) {
        if (authUser == null) {
            return StoreAuth.builder().build();
        }

        Object userInfo = null;
        if ("BO".equals(authUser.userTypeCd())) {
            userInfo = getBoUser(authUser);
        } else {
            userInfo = getFoUser(authUser);
        }

        return StoreAuth.builder()
                .accessToken(CmUtil.nvl(authUser.accessToken())) // 액세스 토큰
                .refreshToken(CmUtil.nvl(authUser.refreshToken())) // 리프레시 토큰
                .accessExpiresIn(3600L) // 액세스 토큰 만료시간(초)
                .refreshExpiresIn(604800L) // 리프레시 토큰 만료시간(초, 7일)
                .user(userInfo) // 사용자 정보
                .build();
    }

    /**
     * 관리자 정보 조회 - BO: sy_user(관리자)
     */
    private StoreUser getBoUser(AuthPrincipal authUser) {
        if (authUser == null || authUser.userId() == null) {
            return StoreUser.builder().build();
        }

        SyUser user = syUserRepository.findById(authUser.userId()).orElse(null);
        if (user == null) {
            return StoreUser.builder().build();
        }

        String deptNm = "";
        if (user.getDeptId() != null) {
            SyDept dept = syDeptRepository.findById(user.getDeptId()).orElse(null);
            if (dept != null) {
                deptNm = dept.getDeptNm();
            }
        }

        String roleNm = "";
        if (user.getRoleId() != null) {
            SyRole role = syRoleRepository.findById(user.getRoleId()).orElse(null);
            if (role != null) {
                roleNm = role.getRoleNm();
            }
        }

        return StoreUser.builder()
                .userId(user.getUserId()) // 사용자ID
                .userName(CmUtil.nvl(user.getUserNm())) // 사용자명
                .userEmail(CmUtil.nvl(user.getUserEmail())) // 이메일
                .userHpNo(CmUtil.nvl(user.getUserPhone())) // 휴대폰
                .deptId(CmUtil.nvl(user.getDeptId())) // 부서ID
                .deptNm(deptNm) // 부서명
                .roleId(CmUtil.nvl(user.getRoleId())) // 역할ID
                .roleNm(roleNm) // 역할명
                .userStatusCd(CmUtil.nvl(user.getUserStatusCd(), "ACTIVE")) // 상태
                .isAdminYn("N") // 관리자여부
                .companyId("") // 회사ID
                .companyNm("") // 회사명
                .boBookmarks("") // 즐겨찾기
                .build();
    }

    /**
     * 회원 정보 조회 - FO: ec_member(회원)
     */
    private StoreMember getFoUser(AuthPrincipal authUser) {
        if (authUser == null || authUser.userId() == null) {
            return StoreMember.builder().build();
        }

        MbMember member = memberRepository.findById(authUser.userId()).orElse(null);
        if (member == null) {
            return StoreMember.builder().build();
        }

        return StoreMember.builder()
                .memberId(member.getMemberId()) // 회원ID
                .memberEmail(member.getLoginId()) // 이메일(로그인ID)
                .memberNm(member.getMemberNm()) // 회원명
                .siteId(CmUtil.nvl(member.getSiteId())) // 사이트ID
                .memberTypeCd("") // 회원유형
                .memberHpNo(CmUtil.nvl(member.getMemberPhone())) // 휴대폰
                .memberGrade(CmUtil.nvl(member.getGradeCd())) // 회원등급
                .memberStaffYn("N") // 직원여부
                .memberBirthDt(CmUtil.nvl(member.getBirthDate() != null ? member.getBirthDate().toString() : null)) // 생년월일
                .memberStatusCd(CmUtil.nvl(member.getMemberStatusCd())) // 상태
                .cartCount(0L) // 장바구니수
                .likeCount(0L) // 찜한상품수
                .build();
    }

    /**
     * 권한 정보 조회
     * BO/SO: sy_user_role(역할ID) + sy_vendor_user(업체ID) + sy_vendor(업체명) + sy_role(역할정보)
     * FO: 빈 리스트
     */
    private List<StoreRole> getRoles(AuthPrincipal authUser) {
        if (authUser == null) {
            return List.of();
        }

        Map<String, String> roleVendorMap = new java.util.HashMap<>();

        if ("BO".equals(authUser.userTypeCd()) || "SO".equals(authUser.userTypeCd())) {
            List<SyUserRole> userRoles = syUserRoleRepository.findAll().stream()
                    .filter(ur -> ur.getUserId().equals(authUser.userId()))
                    .toList();
            for (SyUserRole userRole : userRoles) {
                roleVendorMap.put(userRole.getRoleId(), null);
            }

            List<SyVendorUser> vendorUsers = syVendorUserRepository.findAll().stream()
                    .filter(vu -> vu.getUserId().equals(authUser.userId()) && vu.getRoleId() != null)
                    .toList();
            for (SyVendorUser vendorUser : vendorUsers) {
                roleVendorMap.put(vendorUser.getRoleId(), vendorUser.getVendorId());
            }
        } else {
            return List.of();
        }

        return roleVendorMap.entrySet().stream()
                .map(entry -> {
                    SyRole role = syRoleRepository.findById(entry.getKey()).orElse(null);
                    if (role == null) return null;

                    String vendorNm = null;
                    if (entry.getValue() != null) {
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
                            .roleRemark(CmUtil.nvl(role.getRoleRemark()))
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

        List<SyRoleMenu> roleMenus = syRoleMenuRepository.findAll().stream()
                .filter(rm -> rm.getRoleId().equals(authUser.roleId()))
                .toList();

        java.util.Set<String> menuIds = new java.util.HashSet<>();
        for (SyRoleMenu roleMenu : roleMenus) {
            menuIds.add(roleMenu.getMenuId());
            addParentMenus(roleMenu.getMenuId(), menuIds);
        }

        return menuIds.stream()
                .map(menuId -> syMenuRepository.findById(menuId).orElse(null))
                .filter(menu -> menu != null)
                .map(menu -> {
                    int menuLevel = getMenuLevel(menu);
                    return StoreMenu.builder()
                            .menuId(menu.getMenuId()) // 메뉴ID
                            .menuNm(menu.getMenuNm()) // 메뉴명
                            .menuPath(CmUtil.nvl(menu.getMenuUrl())) // 메뉴경로
                            .parentMenuId(CmUtil.nvl(menu.getParentMenuId())) // 상위메뉴ID
                            .menuLevel(menuLevel) // 메뉴레벨(1,2,3...)
                            .menuSortOrd(String.valueOf(menu.getSortOrd() != null ? menu.getSortOrd() : 0)) // 정렬순서
                            .menuIconCd(CmUtil.nvl(menu.getIconClass())) // 아이콘코드
                            .menuStatusCd(CmUtil.nvl(menu.getUseYn(), "Y")) // 상태
                            .menuRemark(CmUtil.nvl(menu.getMenuRemark())) // 비고
                            .regDate(menu.getRegDate() != null ? menu.getRegDate().toString() : null) // 등록일시
                            .modDate(menu.getUpdDate() != null ? menu.getUpdDate().toString() : null) // 수정일시
                            .build();
                })
                .toList();
    }

    private void addParentMenus(String menuId, java.util.Set<String> menuIds) {
        SyMenu menu = syMenuRepository.findById(menuId).orElse(null);
        if (menu != null && menu.getParentMenuId() != null) {
            menuIds.add(menu.getParentMenuId());
            addParentMenus(menu.getParentMenuId(), menuIds);
        }
    }

    private int getMenuLevel(SyMenu menu) {
        int level = 1;
        SyMenu parent = menu;
        while (parent.getParentMenuId() != null) {
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

        syCodeRepository.findAll().forEach(code -> {
            StoreCode.CodeInfo codeInfo = StoreCode.CodeInfo.builder()
                    .codeGrp(code.getCodeGrp())
                    .codeId(code.getCodeId())
                    .codeNm(code.getCodeLabel())
                    .codeVal(CmUtil.nvl(code.getCodeValue()))
                    .codeSortOrd(String.valueOf(code.getSortOrd() != null ? code.getSortOrd() : 0))
                    .codeRemark(CmUtil.nvl(code.getCodeRemark()))
                    .build();

            codes.add(codeInfo);
        });

        return StoreCode.builder().codes(codes).build();
    }

    /**
     * 속성 정보 조회 - sy_prop (시스템속성)
     */
    private StoreProp getProps(AuthPrincipal authUser) {
        String siteId = authUser != null ? authUser.siteId() : null;
        Map<String, StoreProp.PropInfo> propsByKey = syPropRepository.findAll().stream()
                .filter(prop -> siteId == null || prop.getSiteId().equals(siteId))
                .collect(Collectors.toMap(
                        SyProp::getPropKey,
                        prop -> StoreProp.PropInfo.builder()
                                .propKey(prop.getPropKey())
                                .propVal(CmUtil.nvl(prop.getPropValue()))
                                .propNm(CmUtil.nvl(prop.getPropLabel()))
                                .propRemark(CmUtil.nvl(prop.getPropRemark()))
                                .build(),
                        (old, neu) -> neu
                ));
        return StoreProp.builder().propsByKey(propsByKey).build();
    }

    /**
     * 앱 정보 조회 - 버전, 사이트정보, 환경상태
     * active 값: spring.profiles.active 설정값 (dev, prod 등)
     */
    private StoreApp getApp(AuthPrincipal authUser) {
        String[] activeProfiles = environment.getActiveProfiles();
        String active = (activeProfiles != null && activeProfiles.length > 0) ? activeProfiles[0] : "-";

        if (authUser != null && "BO".equals(authUser.userTypeCd())) {
            return StoreApp.builder()
                    .boSiteNo("01")
                    .foSiteNo("01")
                    .appVersion("2.6.0")
                    .lastUpdateDate(java.time.LocalDate.now().toString())
                    .active(active)
                    .build();
        }
        return StoreApp.builder()
                .foSiteNo(System.getProperty("fo.site.no", "01"))
                .appVersion("2.6.0")
                .lastUpdateDate(java.time.LocalDate.now().toString())
                .active(active)
                .build();
    }


    /**
     * 전시 구조 조회 - dp_ui, dp_area, dp_panel, dp_panel_item (content 제외)
     */
    private StoreDispStruct getDispStruc(AuthPrincipal authUser) {
        List<DpUi> uis = dpUiRepository.findAll().stream()
                .filter(ui -> ui.getSiteId().equals(authUser.siteId()) && "Y".equals(ui.getUseYn()))
                .toList();

        List<StoreDispStruct.UiInfo> uiInfos = uis.stream()
                .map(ui -> {
                    List<DpArea> areas = dpAreaRepository.findAll().stream()
                            .filter(area -> area.getUiId().equals(ui.getUiId()) && "Y".equals(area.getUseYn()))
                            .toList();

                    List<StoreDispStruct.UiInfo.AreaInfo> areaInfos = areas.stream()
                            .map(area -> {
                                List<DpPanel> panels = dpPanelRepository.findAll().stream()
                                        .filter(panel -> panel.getSiteId().equals(authUser.siteId()) && "Y".equals(panel.getUseYn()))
                                        .toList();

                                List<StoreDispStruct.UiInfo.AreaInfo.PanelInfo> panelInfos = panels.stream()
                                        .map(panel -> {
                                            List<DpPanelItem> items = dpPanelItemRepository.findAll().stream()
                                                    .filter(item -> item.getPanelId().equals(panel.getPanelId()))
                                                    .toList();

                                            List<StoreDispStruct.WidgetInfo> widgets = items.stream()
                                                    .map(item -> StoreDispStruct.WidgetInfo.builder()
                                                            .widgetId(item.getPanelItemId())
                                                            .widgetNm(CmUtil.nvl(item.getWidgetTitle()))
                                                            .widgetTypeCd(CmUtil.nvl(item.getWidgetTypeCd()))
                                                            .widgetStatusCd("ACTIVE")
                                                            .widgetSortOrd(String.valueOf(item.getItemSortOrd() != null ? item.getItemSortOrd() : 0))
                                                            .build())
                                                    .toList();

                                            return StoreDispStruct.UiInfo.AreaInfo.PanelInfo.builder()
                                                    .panelId(panel.getPanelId())
                                                    .panelNm(panel.getPanelNm())
                                                    .panelStatusCd(CmUtil.nvl(panel.getDispPanelStatusCd(), "ACTIVE"))
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

        List<DpUi> uis = dpUiRepository.findAll().stream()
                .filter(ui -> ui.getSiteId().equals(authUser.siteId()) && "Y".equals(ui.getUseYn()))
                .toList();

        for (DpUi ui : uis) {
            List<DpArea> areas = dpAreaRepository.findAll().stream()
                    .filter(area -> area.getUiId().equals(ui.getUiId()) && "Y".equals(area.getUseYn()))
                    .toList();

            for (DpArea area : areas) {
                Map<String, Object> areaData = new java.util.HashMap<>();
                List<DpPanel> panels = dpPanelRepository.findAll().stream()
                        .filter(panel -> panel.getSiteId().equals(authUser.siteId()) && "Y".equals(panel.getUseYn()))
                        .toList();

                List<Map<String, Object>> panelDataList = new java.util.ArrayList<>();
                for (DpPanel panel : panels) {
                    List<DpPanelItem> items = dpPanelItemRepository.findAll().stream()
                            .filter(item -> item.getPanelId().equals(panel.getPanelId()))
                            .toList();

                    List<Map<String, Object>> widgetDataList = new java.util.ArrayList<>();
                    for (DpPanelItem item : items) {
                        Map<String, Object> widgetData = new java.util.HashMap<>();
                        widgetData.put("widgetId", item.getPanelItemId()); // 위젯ID
                        widgetData.put("widgetTypeCd", CmUtil.nvl(item.getWidgetTypeCd())); // 위젯타입
                        widgetData.put("widgetTitle", CmUtil.nvl(item.getWidgetTitle())); // 위젯제목

                        String content = CmUtil.nvl(item.getWidgetContent()); // 위젯컨텐츠
                        if ("Y".equals(item.getWidgetLibRefYn()) && item.getWidgetLibId() != null) {
                            DpWidgetLib widgetLib = dpWidgetLibRepository.findById(item.getWidgetLibId()).orElse(null);
                            if (widgetLib != null) {
                                content = CmUtil.nvl(widgetLib.getWidgetLibDesc()); // 라이브러리참조시 라이브러리컨텐츠
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
     * 전시 위젯 목록 조회 - dp_widget (유효한 위젯 목록, 참조형식이면 dp_widget_lib content 포함)
     */
    private StoreDispWidgets getDispWidgets(AuthPrincipal authUser) {
        List<DpWidget> widgets = dpWidgetRepository.findAll().stream()
                .filter(widget -> "Y".equals(widget.getUseYn()))
                .toList();

        List<StoreDispWidgets.WidgetInfo> widgetInfos = widgets.stream()
                .map(widget -> {
                    String content = CmUtil.nvl(widget.getWidgetContent()); // 위젯 자체 content
                    // 참조형식(widgetLibRefYn='Y')이면 dp_widget_lib에서 content 조회
                    if ("Y".equals(widget.getWidgetLibRefYn()) && widget.getWidgetLibId() != null) {
                        DpWidgetLib widgetLib = dpWidgetLibRepository.findById(widget.getWidgetLibId()).orElse(null);
                        if (widgetLib != null) {
                            content = CmUtil.nvl(widgetLib.getWidgetLibDesc()); // 라이브러리 content로 대체
                        }
                    }

                    return StoreDispWidgets.WidgetInfo.builder()
                            .widgetLibId(widget.getWidgetLibId()) // 위젯라이브러리ID (참조시에만)
                            .widgetLibNm(widget.getWidgetNm()) // 위젯명
                            .widgetTypeCd(CmUtil.nvl(widget.getWidgetTypeCd())) // 위젯타입코드
                            .widgetLibDesc(content) // 위젯 content (참조형식이면 라이브러리 content)
                            .widgetLibStatusCd(CmUtil.nvl(widget.getUseYn(), "Y")) // 위젯상태코드
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
