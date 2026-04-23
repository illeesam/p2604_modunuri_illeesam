package com.shopjoy.ecadminapi.co.cm.controller;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;

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
     * @param req 요청 정보 (names: "ALL" 또는 "syAuth^syRoles^syMenus^syCodes^syProps^dpDisp^syApp" 형식)
     * @return 요청된 초기화 데이터
     */
    @PostMapping("/getInitData")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(@RequestBody(required = false) Map<String, Object> req) {
        String names = req != null ? (String) req.get("names") : "";

        if ("ALL".equalsIgnoreCase(names)) {
            names = CmStoreConst.SY_AUTH;
            names += "^" + CmStoreConst.SY_ROLES;
            names += "^" + CmStoreConst.SY_MENUS;
            names += "^" + CmStoreConst.SY_CODES;
            names += "^" + CmStoreConst.SY_PROPS;
            names += "^" + CmStoreConst.DP_DISP;
            names += "^" + CmStoreConst.SY_APP;
        }

        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(names)));
    }

    @PostMapping("/getAuth")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_AUTH)));
    }

    @PostMapping("/getUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_USER)));
    }

//    @PostMapping("/getMember")
//    public ResponseEntity<ApiResponse<Map<String, Object>>> getMember() {
//        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.MB_MEMBER)));
//    }

    @PostMapping("/getRoles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoles() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_ROLES)));
    }

    @PostMapping("/getMenus")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenus() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_MENUS)));
    }

    @PostMapping("/getCodes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCodes() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_CODES)));
    }

    @PostMapping("/getProps")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_PROPS)));
    }

    @PostMapping("/getDisp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDisp() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.DP_DISP)));
    }

    @PostMapping("/getApp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_APP)));
    }

}
