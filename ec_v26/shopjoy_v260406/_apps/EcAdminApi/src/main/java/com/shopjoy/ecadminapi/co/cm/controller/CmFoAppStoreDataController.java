package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
     * FO 애플리케이션 초기화 데이터 조회 (통합)
     * 누구나 접근 가능 (공개 설정)
     *
     * @param names 조회할 데이터 ("ALL" 또는 "syAuth^syRoles^syMenus^syCodes^syProps^dpDisp^syApp" 형식)
     * @return 요청된 초기화 데이터
     */
    @GetMapping("/getInitData")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(@RequestParam(required = false) String names) {
        if (names == null || names.trim().isEmpty()) {
            throw new CmBizException("names 파라미터는 필수입니다. 예: ?names=ALL");
        }

        if (names.toUpperCase().contains("ALL")) {
            names = String.join("^",
                CmStoreConst.SY_AUTH,
                CmStoreConst.SY_ROLES,
                CmStoreConst.SY_MENUS,
                CmStoreConst.SY_CODES,
                CmStoreConst.SY_PROPS,
                CmStoreConst.SY_APP
            );
        }

        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(names, CmStoreConst.FO)));
    }

    @GetMapping("/getAuth")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_AUTH, CmStoreConst.FO)));
    }

    @GetMapping("/getUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_USER, CmStoreConst.FO)));
    }

//    @PostMapping("/getMember")
//    public ResponseEntity<ApiResponse<Map<String, Object>>> getMember() {
//        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.MB_MEMBER)));
//    }

    @GetMapping("/getRoles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoles() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_ROLES, CmStoreConst.FO)));
    }

    @GetMapping("/getMenus")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenus() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_MENUS, CmStoreConst.FO)));
    }

    @GetMapping("/getCodes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCodes() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_CODES, CmStoreConst.FO)));
    }

    @GetMapping("/getProps")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_PROPS, CmStoreConst.FO)));
    }

    @PostMapping("/getDisp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDisp() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.DP_DISP, CmStoreConst.FO)));
    }

    @GetMapping("/getApp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp() {
        return ResponseEntity.ok(ApiResponse.ok(storeDataService.getAuthData(CmStoreConst.SY_APP, CmStoreConst.FO)));
    }

}
