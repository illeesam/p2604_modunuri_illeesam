package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreCodeData;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreMenuInfo;
import com.shopjoy.ecadminapi.co.cm.data.vo.StorePropData;
import com.shopjoy.ecadminapi.co.cm.data.vo.StoreRoleInfo;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

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
     * @param names 조회할 항목 ('^' 구분자, 예: "auth^user^role^menu^code^props^disp-struc^disp-data^app")
     *              빈 값 또는 null 시 모든 항목 반환
     * @return 토큰, 사용자, 권한, 메뉴, 코드, 속성, 전시 구조, 전시 데이터, 앱 정보 포함
     */
    @GetMapping("/getInitData")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(
            @RequestParam(value = "names", required = false, defaultValue = "") String names) {
        List<String> requestedItems = parseNames(names);
        boolean requestAll = requestedItems.isEmpty();

        Map<String, Object> result = new HashMap<>();

        if (requestAll || requestedItems.contains(CmStoreConst.SY_AUTH)) {
            result.put(CmStoreConst.SY_AUTH, storeDataService.getFoAuth());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_USER)) {
            result.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_ROLES)) {
            result.put(CmStoreConst.SY_ROLES, storeDataService.getFoRole());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_MENUS)) {
            result.put(CmStoreConst.SY_MENUS, storeDataService.getFoMenu());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_CODES)) {
            result.put(CmStoreConst.SY_CODES, storeDataService.getFoCode());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_PROPS)) {
            result.put(CmStoreConst.SY_PROPS, storeDataService.getFoProps());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.DP_DISP)) {
            Map<String, Object> dispMap = new HashMap<>();
            dispMap.put(CmStoreConst.DP_DISP_STRUC, storeDataService.getFoDispStruc());
            dispMap.put(CmStoreConst.DP_DISP_DATA, storeDataService.getFoDispData());
            result.put(CmStoreConst.DP_DISP, dispMap);
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_APP)) {
            result.put(CmStoreConst.SY_APP, storeDataService.getFoApp());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/getAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getAuth() {
        Map<String, Object> result = new HashMap<>();
        result.put(CmStoreConst.SY_AUTH, storeDataService.getFoAuth());
        return ResponseEntity.ok(ApiResponse.ok(result.get(CmStoreConst.SY_AUTH)));
    }

    @GetMapping("/getUser")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getUser() {
        Map<String, Object> result = new HashMap<>();
        result.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser());
        return ResponseEntity.ok(ApiResponse.ok(result.get(CmStoreConst.MB_MEMBER)));
    }

    @GetMapping("/getMember")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getMember() {
        Map<String, Object> result = new HashMap<>();
        result.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser());
        return ResponseEntity.ok(ApiResponse.ok(result.get(CmStoreConst.MB_MEMBER)));
    }

    @GetMapping("/getRole")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<StoreRoleInfo>>> getRole() {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getFoRole());
        return ResponseEntity.ok(ApiResponse.ok((List<StoreRoleInfo>) resultMap.get(CmStoreConst.SY_ROLES)));
    }

    @GetMapping("/getMenu")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<StoreMenuInfo>>> getMenu() {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getFoMenu());
        return ResponseEntity.ok(ApiResponse.ok((List<StoreMenuInfo>) resultMap.get(CmStoreConst.SY_MENUS)));
    }

    @GetMapping("/getCode")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<StoreCodeData>> getCode() {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_CODES, storeDataService.getFoCode());
        return ResponseEntity.ok(ApiResponse.ok((StoreCodeData) resultMap.get(CmStoreConst.SY_CODES)));
    }

    @GetMapping("/getProps")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<StorePropData>> getProps() {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getFoProps());
        return ResponseEntity.ok(ApiResponse.ok((StorePropData) resultMap.get(CmStoreConst.SY_PROPS)));
    }

    @GetMapping("/getDisp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDisp() {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.DP_DISP_STRUC, storeDataService.getFoDispStruc());
        resultMap.put(CmStoreConst.DP_DISP_DATA, storeDataService.getFoDispData());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @GetMapping("/getApp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getApp() {
        Map<String, Object> result = new HashMap<>();
        result.put(CmStoreConst.SY_APP, storeDataService.getFoApp());
        return ResponseEntity.ok(ApiResponse.ok(result.get(CmStoreConst.SY_APP)));
    }

    private List<String> parseNames(String names) {
        List<String> items = new ArrayList<>();
        if (names == null || names.trim().isEmpty()) {
            return items;
        }
        String[] parts = names.split("\\^");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                items.add(trimmed);
            }
        }
        return items;
    }
}
