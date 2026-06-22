package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * BO 대시보드 API — cm_dashboard 기반 차트 데이터셋 제공.
 *
 * <pre>
 * POST /api/bo/ec/cm/dashboard/data
 *   Body: [{compId, siteNo, uiNm, ...파라미터}, ...]
 *   각 항목은 compId 를 반드시 포함하며 나머지 파라미터는 항목별 자유 지정
 * </pre>
 */
@RestController
@RequestMapping("/api/bo/ec/cm/dashboard")
@RequiredArgsConstructor
public class BoCmDashboardController {

    private final CmDashboardService cmDashboardService;

    /**
     * 대시보드 데이터 조회.
     *
     * @param items [{compId: "COMP0101", siteNo: "01", uiNm: "DashboardBoEc01", ...}, ...]
     * @return {"info0101": [...], "info0202": [...], ...}
     */
    @PostMapping("/data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> data(
            @RequestBody List<Map<String, Object>> items) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardService.getDashboard(items)));
    }
}
