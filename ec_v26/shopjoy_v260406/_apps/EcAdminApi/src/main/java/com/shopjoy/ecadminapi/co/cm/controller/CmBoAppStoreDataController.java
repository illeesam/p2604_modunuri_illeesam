package com.shopjoy.ecadminapi.co.cm.controller;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;

/**
 * BO (Back Office) 애플리케이션 Store 데이터 API
 *
 * Store별 개별 엔드포인트:
 * GET /api/co/cm/bo-app-store/getInitData   - 통합 초기화 데이터 (names 파라미터로 선택)
 * GET /api/co/cm/bo-app-store/getAuth       - 인증 정보 (토큰)
 * GET /api/co/cm/bo-app-store/getUser       - 관리자 정보
 * GET /api/co/cm/bo-app-store/getRole       - 권한 정보
 * GET /api/co/cm/bo-app-store/getMenu       - 메뉴 정보
 * GET /api/co/cm/bo-app-store/getCode       - 공통 코드
 * GET /api/co/cm/bo-app-store/getProps      - 시스템 속성
 * GET /api/co/cm/bo-app-store/getApp        - 앱 정보
 *
 * @author ShopJoy
 */
@RestController
@RequestMapping("/api/co/cm/bo-app-store")
@RequiredArgsConstructor
public class CmBoAppStoreDataController {

    private final CmAppStoreDataService storeDataService;

    /**
     * BO 애플리케이션 초기화 데이터 조회 (통합)
     *
     * @param req 요청 정보 (names: "ALL" 또는 "syAuth^syUser^syRoles^syMenus^syCode^syProps^syApp" 형식)
     * @return 요청된 초기화 데이터
     */
    @PostMapping("/getInitData")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = req != null ? (String) req.get("names") : "";

        // "ALL"인 경우 BO에서 필요한 모든 항목 설정
        if ("ALL".equalsIgnoreCase(names)) {
            names = CmStoreConst.SY_AUTH;
            names += "^" + CmStoreConst.SY_USER;
            names += "^" + CmStoreConst.SY_ROLES;
            names += "^" + CmStoreConst.SY_MENUS;
            names += "^" + CmStoreConst.SY_CODES;
            names += "^" + CmStoreConst.SY_PROPS;
            names += "^" + CmStoreConst.SY_APP;
        }

        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getAuth")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_AUTH;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_USER;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getRoles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoles(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_ROLES;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMenus")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenus(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_MENUS;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getCodes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCodes(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_CODES;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getProps")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_PROPS;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getApp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp(@RequestBody(required = false) Map<String, Object> req) {
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String names = CmStoreConst.SY_APP;
        Map<String, Object> resultMap = storeDataService.getAuthData(names, authUser);
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

}
