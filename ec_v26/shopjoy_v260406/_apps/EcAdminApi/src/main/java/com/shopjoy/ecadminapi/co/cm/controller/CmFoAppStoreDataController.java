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
 * GET /api/co/cm/fo-app-store/getInitData   - 통합 초기화 데이터 (names 파라미터로 선택)
 * GET /api/co/cm/fo-app-store/getAuth       - 인증 정보 (토큰)
 * GET /api/co/cm/fo-app-store/getUser       - 회원 정보
 * GET /api/co/cm/fo-app-store/getMember     - 회원 정보 (별칭)
 * GET /api/co/cm/fo-app-store/getRole       - 권한 정보
 * GET /api/co/cm/fo-app-store/getMenu       - 메뉴 정보
 * GET /api/co/cm/fo-app-store/getCode       - 공통 코드
 * GET /api/co/cm/fo-app-store/getProps      - 시스템 속성
 * GET /api/co/cm/fo-app-store/getDisp       - 전시 정보 (구조 + 데이터)
 * GET /api/co/cm/fo-app-store/getApp        - 앱 정보
 *
 * @author ShopJoy
 */
@RestController
@RequestMapping("/api/co/cm/fo-app-store")
@RequiredArgsConstructor
public class CmFoAppStoreDataController {

    private final CmAppStoreDataService storeDataService;

    /**
     * FO 애플리케이션 초기화 데이터 조회 (통합) - POST 요청
     * 누구나 접근 가능 (공개 설정)
     *
     * @param names 조회할 항목 ('^' 구분자, 선택)
     * @return 토큰, 사용자, 권한, 메뉴, 코드, 속성, 전시 구조, 전시 데이터, 앱 정보 포함
     */
    @PostMapping("/getInitData")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(@RequestBody(required = false) String names) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 데이터만 반환)
        List<String> requestedItems = CmUtil.parseNames(names);
        boolean requestAll = requestedItems.isEmpty();

        Map<String, Object> resultMap = new HashMap<>();

        if (requestAll || requestedItems.contains(CmStoreConst.SY_AUTH)) {
            resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getAuth(authUser));
        }
//        if (requestAll || requestedItems.contains(CmStoreConst.MB_MEMBER)) {
//            resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser(authUser));
//        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_ROLES)) {
            resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getRoles(authUser));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_MENUS)) {
            resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getMenus(authUser));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_CODES)) {
            resultMap.put(CmStoreConst.SY_CODES, storeDataService.getCodes(authUser));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_PROPS)) {
            resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getProps(authUser));
        }
        if (requestAll || requestedItems.contains(CmStoreConst.DP_DISP)) {
            Map<String, Object> dispMap = new HashMap<>();
            dispMap.put(CmStoreConst.DP_DISP_STRUCTS, storeDataService.getDispStruc(authUser));
            dispMap.put(CmStoreConst.DP_DISP_DATAS, storeDataService.getDispData(authUser));
            dispMap.put(CmStoreConst.DP_DISP_WIDGETS, storeDataService.getDispWidgets(authUser));
            resultMap.put(CmStoreConst.DP_DISP, dispMap);
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_APP)) {
            resultMap.put(CmStoreConst.SY_APP, storeDataService.getApp(authUser));
        }

        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getAuth")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth(@RequestBody(required = false) String names) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getAuth(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

//    @PostMapping("/getMember")
//    public ResponseEntity<ApiResponse<Map<String, Object>>> getMember() {
//        AuthPrincipal authUser = SecurityUtil.getAuthUser();
//        // authUser가 null이면 비인증 사용자 (공개 설정)
//        Map<String, Object> resultMap = new HashMap<>();
//        resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser(authUser));
//        return ResponseEntity.ok(ApiResponse.ok(resultMap));
//    }

    @PostMapping("/getRoles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoles() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getRoles(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMenus")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenus() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getMenus(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getCodes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCodes() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_CODES, storeDataService.getCodes(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getProps")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getProps(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getDisp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDisp() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.DP_DISP_STRUCTS, storeDataService.getDispStruc(authUser));
        resultMap.put(CmStoreConst.DP_DISP_DATAS, storeDataService.getDispData(authUser));
        resultMap.put(CmStoreConst.DP_DISP_WIDGETS, storeDataService.getDispWidgets(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getApp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp() {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        // authUser가 null이면 비인증 사용자 (공개 설정)
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_APP, storeDataService.getApp(authUser));
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

}
