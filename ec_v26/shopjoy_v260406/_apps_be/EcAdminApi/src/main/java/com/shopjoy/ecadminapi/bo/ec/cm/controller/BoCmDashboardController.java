package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardDataService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardItemService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 대시보드 API — /api/bo/ec/cm/dashboard
 * <ul>
 *   <li>POST /data — cm_dashboard 기반 차트 데이터셋 제공 (기존)</li>
 *   <li>GET /item/list — 패널 정의 목록</li>
 *   <li>GET /item/{id} — 패널 정의 단건</li>
 *   <li>POST /item/save/{cmd} — 패널 정의 단건 저장</li>
 *   <li>POST /item/save-list/{cmd} — 패널 정의 일괄 저장</li>
 *   <li>GET /data/list — 집계 데이터 목록</li>
 *   <li>POST /data/upsert — 집계 데이터 upsert</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/bo/ec/cm/dashboard")
@RequiredArgsConstructor
public class BoCmDashboardController {

    private final CmDashboardService cmDashboardService;
    private final CmDashboardItemService cmDashboardItemService;
    private final CmDashboardDataService cmDashboardDataService;

    /* ── 기존: 차트 데이터셋 ─────────────────────────────────────── */

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

    /* ── 패널 정의 (CmDashboardItem) ────────────────────────────── */

    /** 패널 정의 목록 — siteId, uiNm, useYn 필터 */
    @GetMapping("/item/list")
    public ResponseEntity<ApiResponse<List<CmDashboardItem>>> itemList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getList(p)));
    }

    /** 패널 정의 단건 */
    @GetMapping("/item/{id}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemGetById(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getById(id)));
    }

    /** 패널 정의 단건 저장 (cmd: base) */
    @PostMapping("/item/save/{cmd}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemSave(
            @PathVariable("cmd") String cmd,
            @RequestBody CmDashboardItem body) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.save(cmd, body)));
    }

    /** 패널 정의 일괄 저장 (cmd: base) */
    @PostMapping("/item/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> itemSaveList(
            @PathVariable("cmd") String cmd,
            @RequestBody List<CmDashboardItem> rows) {
        cmDashboardItemService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* ── 집계 데이터 (CmDashboardData) ──────────────────────────── */

    /** 집계 데이터 목록 — siteId, uiNm, dashboardItemId, yyyymmdd 필터 */
    @GetMapping("/data/list")
    public ResponseEntity<ApiResponse<List<CmDashboardData>>> dataList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataService.getList(p)));
    }

    /** 집계 데이터 upsert — ID 없으면 INSERT, 있으면 UPDATE */
    @PostMapping("/data/upsert")
    public ResponseEntity<ApiResponse<CmDashboardData>> dataUpsert(
            @RequestBody CmDashboardData body) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataService.upsert(body)));
    }
}
