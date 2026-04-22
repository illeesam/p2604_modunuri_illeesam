package com.shopjoy.ecadminapi.co.cm.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;

/**
 * FO (Front Office - 사용자) 애플리케이션 Store 데이터 API
 *
 * Store별 개별 엔드포인트:
 * GET /api/cm/fo-app-store/getInitData   - 통합 초기화 데이터 (names 파라미터로 선택)
 * GET /api/cm/fo-app-store/getAuth       - 인증 정보 (토큰)
 * GET /api/cm/fo-app-store/getUser       - 회원 정보
 * GET /api/cm/fo-app-store/getMember     - 회원 정보 (별칭)
 * GET /api/cm/fo-app-store/getRole       - 권한 정보
 * GET /api/cm/fo-app-store/getMenu       - 메뉴 정보
 * GET /api/cm/fo-app-store/getCode       - 공통 코드
 * GET /api/cm/fo-app-store/getProps      - 시스템 속성
 * GET /api/cm/fo-app-store/getDisp       - 전시 정보 (구조 + 데이터)
 * GET /api/cm/fo-app-store/getApp        - 앱 정보
 *
 * @author ShopJoy
 */
@RestController
@RequestMapping("/api/cm/fo-app-store")
@RequiredArgsConstructor
public class CmFoAppStoreDataController {

    private final CmAppStoreDataService storeDataService;

    /**
     * FO 애플리케이션 초기화 데이터 조회 (통합)
     *
     * @param req 요청 정보 (siteId, userId, roleId 필수, names 선택)
     * @return 토큰, 사용자, 권한, 메뉴, 코드, 속성, 전시 구조, 전시 데이터, 앱 정보 포함
     */
    @PostMapping("/getInitData")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(
            @RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        List<String> requestedItems = CmUtil.parseNames(names);
        boolean requestAll = requestedItems.isEmpty();

        Map<String, Object> resultMap = new HashMap<>();

        if (requestAll || requestedItems.contains(CmStoreConst.SY_AUTH)) {
            resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getFoAuth(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.MB_MEMBER)) {
            resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_ROLES)) {
            resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getFoRole(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_MENUS)) {
            resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getFoMenu(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_CODES)) {
            resultMap.put(CmStoreConst.SY_CODES, storeDataService.getFoCode(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_PROPS)) {
            resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getFoProps(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.DP_DISP)) {
            Map<String, Object> dispMap = new HashMap<>();
            dispMap.put(CmStoreConst.DP_DISP_STRUCTS, storeDataService.getFoDispStruc(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
            dispMap.put(CmStoreConst.DP_DISP_DATAS, storeDataService.getFoDispData(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
            resultMap.put(CmStoreConst.DP_DISP, dispMap);
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_APP)) {
            resultMap.put(CmStoreConst.SY_APP, storeDataService.getFoApp(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        }

        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getAuth")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getFoAuth(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMember")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMember(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getRole")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRole(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getFoRole(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMenu")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenu(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getFoMenu(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getCode")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCode(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_CODES, storeDataService.getFoCode(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getProps")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getFoProps(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getDisp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDisp(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.DP_DISP_STRUCTS, storeDataService.getFoDispStruc(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        resultMap.put(CmStoreConst.DP_DISP_DATAS, storeDataService.getFoDispData(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getApp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp(@RequestBody String names) {
        String siteId = "01";
        String userTypeCd = "FO";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId = authUser.userId();
        String roleId = CmUtil.nvl(authUser.roleId());
        boolean isLogin = SecurityUtil.isLogin();
        boolean isAdmin = false;

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_APP, storeDataService.getFoApp(siteId, userTypeCd, userId, roleId, isLogin, isAdmin));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

}
