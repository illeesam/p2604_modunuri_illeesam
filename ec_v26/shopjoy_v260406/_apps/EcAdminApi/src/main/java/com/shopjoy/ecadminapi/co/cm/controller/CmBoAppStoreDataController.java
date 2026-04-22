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
 * BO (Back Office) 애플리케이션 Store 데이터 API
 *
 * Store별 개별 엔드포인트:
 * GET /api/cm/bo-app-store/getInitData   - 통합 초기화 데이터 (names 파라미터로 선택)
 * GET /api/cm/bo-app-store/getAuth       - 인증 정보 (토큰)
 * GET /api/cm/bo-app-store/getUser       - 관리자 정보
 * GET /api/cm/bo-app-store/getRole       - 권한 정보
 * GET /api/cm/bo-app-store/getMenu       - 메뉴 정보
 * GET /api/cm/bo-app-store/getCode       - 공통 코드
 * GET /api/cm/bo-app-store/getProps      - 시스템 속성
 * GET /api/cm/bo-app-store/getApp        - 앱 정보
 *
 * @author ShopJoy
 */
@RestController
@RequestMapping("/api/cm/bo-app-store")
@RequiredArgsConstructor
public class CmBoAppStoreDataController {

    private final CmAppStoreDataService storeDataService;

    /**
     * BO 애플리케이션 초기화 데이터 조회 (통합)
     *
     * @param req 요청 정보 (siteId, userId, roleId 필수, names 선택)
     * @return 토큰, 사용자, 권한, 메뉴, 코드, 속성, 앱 정보 포함
     */
    @PostMapping("/getInitData")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInitData(
            @Valid @RequestBody CmAppStoreDataReq req) {
        java.util.List<String> requestedItems = parseNames(req.getNames());
        boolean requestAll = requestedItems.isEmpty();

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);

        if (requestAll || requestedItems.contains(CmStoreConst.SY_AUTH)) {
            resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getBoAuth());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_USER)) {
            resultMap.put(CmStoreConst.SY_USER, storeDataService.getBoUser());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_ROLES)) {
            resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getBoRole());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_MENUS)) {
            resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getBoMenu());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_CODES)) {
            resultMap.put(CmStoreConst.SY_CODES, storeDataService.getBoCode());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_PROPS)) {
            resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getBoProps());
        }
        if (requestAll || requestedItems.contains(CmStoreConst.SY_APP)) {
            resultMap.put(CmStoreConst.SY_APP, storeDataService.getBoApp());
        }

        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuth(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_AUTH, storeDataService.getBoAuth());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getUser")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_USER, storeDataService.getBoUser());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getRole")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRole(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_ROLES, storeDataService.getBoRole());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getMenu")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenu(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_MENUS, storeDataService.getBoMenu());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getCode")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCode(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_CODES, storeDataService.getBoCode());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getProps")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProps(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_PROPS, storeDataService.getBoProps());
        return ResponseEntity.ok(ApiResponse.ok(resultMap));
    }

    @PostMapping("/getApp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApp(@Valid @RequestBody CmAppStoreDataReq req) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put(CmStoreConst.REQ_PARAM, req);
        resultMap.put(CmStoreConst.SY_APP, storeDataService.getBoApp());
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
