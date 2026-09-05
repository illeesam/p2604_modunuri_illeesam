package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.MapKeysRes;
import com.shopjoy.ecadminapi.co.cm.service.CmMapService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 지도(맵) 키 발급 API (BO/FO 공통, co 레이어).
 *
 * GET /api/co/cm/map/keys - 카카오맵/네이버맵 JS 공개키 조회 (프론트 SDK 초기화용)
 *
 * <p>/api/co/** 는 SecurityConfig 에서 permitAll 이므로 별도 보안 설정 불필요.
 * 반환 키는 브라우저 노출 가능한 공개키(JS 키 / Client ID)만이며, 시크릿/REST 키는 포함하지 않는다.
 * appTypeCd("BO"|"FO") 는 쿼리 파라미터로 받아 서비스에 전달한다(미전달 시 FO).</p>
 */
@RestController
@RequestMapping("/api/co/cm/map")
@RequiredArgsConstructor
public class CmMapController {

    private final CmMapService mapService;

    /** keys - 카카오맵/네이버맵 JS 공개키 조회 */
    @GetMapping("/keys")
    public ResponseEntity<ApiResponse<MapKeysRes>> keys(
            @RequestParam(value = "appTypeCd", required = false, defaultValue = "FO") String appTypeCd) {
        MapKeysRes result = mapService.getMapKeys(appTypeCd);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
