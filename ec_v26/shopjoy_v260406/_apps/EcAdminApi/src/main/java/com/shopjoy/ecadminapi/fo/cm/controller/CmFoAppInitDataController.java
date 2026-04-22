package com.shopjoy.ecadminapi.fo.cm.controller;

import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.cm.data.vo.FoAppInitDataRes;
import com.shopjoy.ecadminapi.fo.cm.service.CmFoAppInitDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * FO (Front Office - 사용자) 애플리케이션 초기화 데이터 API
 *
 * GET /api/cm/fo-app-init/getInitData
 *   - 로그인 후 필요한 모든 초기화 데이터 조회
 *   - 토큰 정보, 사용자 정보, 권한, 메뉴, 코드, 전시 정보 등
 *   - 호출 시점: 시스템 접근 시, 로그인 후, 권한 변경 후
 *
 * @author ShopJoy
 */
@RestController
@RequestMapping("/api/cm/fo-app-init")
@RequiredArgsConstructor
public class CmFoAppInitDataController {

    private final CmFoAppInitDataService initDataService;

    /**
     * FO 애플리케이션 초기화 데이터 조회
     *
     * @param names 조회할 항목 ('^' 구분자, 예: "auth^user^role^menu^code^props^disp-struc^disp-data^app")
     *              빈 값 또는 null 시 모든 항목 반환
     *              가능한 값: auth, user, role, menu, code, props, disp-struc, disp-data, app
     * @return 토큰, 사용자, 권한, 메뉴, 코드, 전시 정보 포함
     */
    @GetMapping("/getInitData")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FoAppInitDataRes>> getInitData(
            @RequestParam(value = "names", required = false, defaultValue = "") String names) {
        FoAppInitDataRes result = initDataService.getFoAppInitData(names);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
