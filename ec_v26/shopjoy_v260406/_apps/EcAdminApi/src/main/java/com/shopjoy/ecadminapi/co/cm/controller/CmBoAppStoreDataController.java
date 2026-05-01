package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

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
     * @param names 조회할 데이터 ("ALL" 또는 "syAuth^syUser^syRoles^syMenus^syCode^syProps^syApp" 형식)
     * @return 요청된 초기화 데이터
     */
    @GetMapping("/getInitData")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(@RequestParam(name = "names", required = false) String names) {
        if (names == null || names.trim().isEmpty()) {
            throw new CmBizException("names 파라미터는 필수입니다. 예: ?names=ALL");
        }

        if ("ALL".equalsIgnoreCase(names)) {
            names = CmStoreConst.SY_AUTH;
            //names += "^" + CmStoreConst.SY_USER;
            names += "^" + CmStoreConst.SY_ROLES;
            names += "^" + CmStoreConst.SY_MENUS;
            names += "^" + CmStoreConst.SY_CODES;
            names += "^" + CmStoreConst.SY_PROPS;
            names += "^" + CmStoreConst.SY_APP;
        }

        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(names, CmStoreConst.BO)));
    }

    @GetMapping("/getAuth")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_AUTH, CmStoreConst.BO)));
    }

    @GetMapping("/getUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_USER, CmStoreConst.BO)));
    }

    @GetMapping("/getRoles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoles() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_ROLES, CmStoreConst.BO)));
    }

    @GetMapping("/getMenus")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenus() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_MENUS, CmStoreConst.BO)));
    }

    @GetMapping("/getCodes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCodes() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_CODES, CmStoreConst.BO)));
    }

    @GetMapping("/getProps")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_PROPS, CmStoreConst.BO)));
    }

    @GetMapping("/getApp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_APP, CmStoreConst.BO)));
    }

}
