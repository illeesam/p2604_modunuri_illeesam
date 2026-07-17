package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdPlanRepository;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * BO 상품 판매계획 API
 *
 * GET  /api/bo/ec/pd/prod/{prodId}/plans   — 판매계획 목록
 * PUT  /api/bo/ec/pd/prod/{prodId}/plans   — 판매계획 전체 교체 저장
 */
@RestController
@RequestMapping("/api/bo/ec/pd/prod/{prodId}/plans")
@RequiredArgsConstructor
public class BoPdProdPlanController {

    private final PdProdPlanRepository planRepository;

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** 목록 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdPlan>>> list(
            @PathVariable("prodId") String prodId) {
        return ResponseEntity.ok(ApiResponse.ok(planRepository.findByProdIdOrderBySortOrdAsc(prodId)));
    }

    /**
     * 전체 교체 저장.
     * body: { "plans": [ { startDate, startTime, endDate, endTime, planStatus, listPrice, salePrice, purchasePrice } ] }
     */
    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<Void>> save(
            @PathVariable("prodId") String prodId,
            @RequestBody Map<String, Object> body) {

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = body != null && body.get("plans") instanceof List
            ? (List<Map<String, Object>>) body.get("plans") : List.of();

        String authId  = SecurityUtil.getAuthUser().authId();
        String siteId  = SecurityUtil.getSiteIdOrDefault("SITE000001");
        LocalDateTime now = LocalDateTime.now();

        // 기존 전체 삭제
        planRepository.deleteByProdId(prodId);

        int sortOrd = 1;
        for (Map<String, Object> row : rows) {
            // startDate + startTime → LocalDateTime
            String startDate = str(row.get("startDate"));
            String startTime = str(row.get("startTime"));
            String endDate   = str(row.get("endDate"));
            String endTime   = str(row.get("endTime"));

            LocalDateTime startDt = parseDatetime(startDate, startTime);
            LocalDateTime endDt   = parseDatetime(endDate,   endTime);

            String statusCd = str(row.get("planStatus"));
            if (statusCd == null || statusCd.isBlank()) statusCd = "SCHEDULED";

            PdProdPlan plan = new PdProdPlan();
            plan.setPlanId("PP" + now.format(ID_FMT) + String.format("%05d", (int)(Math.random() * 100000)));
            plan.setSiteId(siteId);
            plan.setProdId(prodId);
            plan.setStartDatetime(startDt);
            plan.setEndDatetime(endDt);
            plan.setPlanStatusCd(statusCd);
            plan.setListPrice(toLong(row.get("listPrice")));
            plan.setSalePrice(toLong(row.get("salePrice")));
            plan.setPurchasePrice(toLong(row.get("purchasePrice")));
            plan.setSortOrd(sortOrd++);
            plan.setRegBy(authId);
            plan.setRegDate(now);
            plan.setUpdBy(authId);
            plan.setUpdDate(now);
            planRepository.save(plan);
        }

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* ---- helpers ---- */

    private String str(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        try { return Long.parseLong(String.valueOf(v)); } catch (Exception e) { return null; }
    }

    private LocalDateTime parseDatetime(String date, String time) {
        if (date == null || date.isBlank()) return null;
        String t = (time != null && time.length() >= 5) ? time.substring(0, 5) : "00:00";
        try {
            return LocalDateTime.parse(date + "T" + t + ":00");
        } catch (Exception e) {
            return null;
        }
    }
}
