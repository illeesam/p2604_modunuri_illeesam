package com.shopjoy.ecadminapi.co.cm.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.shopjoy.ecadminapi.co.cm.constant.CmStoreConst;
import com.shopjoy.ecadminapi.co.cm.data.req.CmAppStoreDataReq;
import com.shopjoy.ecadminapi.co.cm.service.CmAppStoreDataService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;

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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(
            @Valid @RequestBody CmAppStoreDataReq req) {
        List<String> requestedItems = parseNames(req.getNames());
        boolean requestAll = requestedItems.isEmpty();

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);

        if (requestAll || requestedItems.contains(CmStoreConst.SY_AUTH)) {
            resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getFoAuth());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.MB_MEMBER)) {
            resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_ROLES)) {
            resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getFoRole());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_MENUS)) {
            resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getFoMenu());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_CODES)) {
            resultMap.put(CmStoreConst.SY_CODES, storeDataService.getFoCode());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_PROPS)) {
            resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getFoProps());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.DP_DISP)) {
            Map<String, Object> dispMap = new HashMap<>();
            dispMap.put(CmStoreConst.DP_DISP_STRUCTS, storeDataService.getFoDispStruc());
            dispMap.put(CmStoreConst.DP_DISP_DATAS, storeDataService.getFoDispData());
            resultMap.put(CmStoreConst.DP_DISP, dispMap);
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_APP)) {
            resultMap.put(CmStoreConst.SY_APP, storeDataService.getFoApp());
        }

        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getFoAuth());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getUser")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMember")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMember(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.MB_MEMBER, storeDataService.getFoUser());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getRole")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRole(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getFoRole());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMenu")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenu(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getFoMenu());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getCode")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCode(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_CODES, storeDataService.getFoCode());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getProps")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getFoProps());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getDisp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDisp(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.DP_DISP_STRUCTS, storeDataService.getFoDispStruc());
        resultMap.put(CmStoreConst.DP_DISP_DATAS, storeDataService.getFoDispData());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getApp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_APP, storeDataService.getFoApp());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
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
