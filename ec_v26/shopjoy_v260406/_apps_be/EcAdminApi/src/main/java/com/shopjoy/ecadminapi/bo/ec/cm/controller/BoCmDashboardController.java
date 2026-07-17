package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardItemDataService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardItemService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bo/ec/cm/dashboard")
@RequiredArgsConstructor
public class BoCmDashboardController {

    private final CmDashboardService cmDashboardService;
    private final CmDashboardItemService cmDashboardItemService;
    private final CmDashboardItemDataService cmDashboardItemDataService;
    private final CmDashboardRepository cmDashboardRepository;

    /* ── 차트 데이터셋 ────────────────────────────────────────── */

    @PostMapping("/data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> data(
            @RequestBody List<Map<String, Object>> items) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardService.getDashboard(items)));
    }

    /** 일별 현황 집계 — SyStatsAggregationJob 과 동일한 쿼리를 온디맨드 실행. */
    @GetMapping("/daily-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dailyStats(
            @RequestParam(required = false) String targetDate) {
        LocalDate date = targetDate != null && !targetDate.isBlank()
            ? LocalDate.parse(targetDate)
            : null;
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardService.getDailyStats(date)));
    }

    /* ── cm_dashboard CRUD ─────────────────────────────────────── */

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<CmDashboard>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String useYn) {
        List<CmDashboard> result;
        if (siteId != null && useYn != null) {
            result = cmDashboardRepository.findBySiteIdAndUseYnOrderBySortOrdAsc(siteId, useYn);
        } else if (siteId != null) {
            result = cmDashboardRepository.findBySiteIdOrderBySortOrdAsc(siteId);
        } else {
            result = cmDashboardRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmDashboard>> getById(@PathVariable("id") String id) {
        CmDashboard entity = cmDashboardRepository.findById(id)
            .orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않습니다: " + id));
        return ResponseEntity.ok(ApiResponse.ok(entity));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmDashboard>> create(@RequestBody CmDashboard body) {
        String authId = SecurityUtil.getAuthUser().authId();
        body.setDashboardId(CmUtil.generateId("cm_dashboard"));
        body.setRegBy(authId); body.setRegDate(LocalDateTime.now());
        body.setUpdBy(authId); body.setUpdDate(LocalDateTime.now());
        if (body.getUseYn() == null) body.setUseYn("Y");
        return ResponseEntity.status(201).body(ApiResponse.created(cmDashboardRepository.save(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmDashboard>> update(
            @PathVariable("id") String id, @RequestBody CmDashboard body) {
        CmDashboard entity = cmDashboardRepository.findById(id)
            .orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않습니다: " + id));
        if (body.getDashboardNm() != null) entity.setDashboardNm(body.getDashboardNm());
        if (body.getUiCompNm() != null)    entity.setUiCompNm(body.getUiCompNm());
        if (body.getLayoutCols() != null)  entity.setLayoutCols(body.getLayoutCols());
        if (body.getSortOrd() != null)     entity.setSortOrd(body.getSortOrd());
        if (body.getUseYn() != null)       entity.setUseYn(body.getUseYn());
        if (body.getRemark() != null)      entity.setRemark(body.getRemark());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardRepository.save(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        cmDashboardRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ── 패널 정의 (CmDashboardItem) ──────────────────────────── */

    @GetMapping("/item/list")
    public ResponseEntity<ApiResponse<List<CmDashboardItem>>> itemList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getList(p)));
    }

    @GetMapping("/item/{id}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemGetById(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getById(id)));
    }

    @PostMapping("/item/save/{cmd}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemSave(
            @PathVariable("cmd") String cmd,
            @RequestBody CmDashboardItem body) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.save(cmd, body)));
    }

    @PostMapping("/item/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> itemSaveList(
            @PathVariable("cmd") String cmd,
            @RequestBody List<CmDashboardItem> rows) {
        cmDashboardItemService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* ── 집계 데이터 (CmDashboardItemData) ───────────────────── */

    @GetMapping("/item-data/list")
    public ResponseEntity<ApiResponse<List<CmDashboardItemData>>> itemDataList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemDataService.getList(p)));
    }

    @PostMapping("/item-data/upsert")
    public ResponseEntity<ApiResponse<CmDashboardItemData>> itemDataUpsert(
            @RequestBody CmDashboardItemData body) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemDataService.upsert(body)));
    }
}
