package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmPlanService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 기획전 API — /api/bo/ec/pm/plan
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/plan")
@RequiredArgsConstructor
public class BoPmPlanController {
    private final BoPmPlanService boPmPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmPlanDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PmPlanDto> result = boPmPlanService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmPlanDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PmPlanDto> result = boPmPlanService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanDto>> getById(@PathVariable("id") String id) {
        PmPlanDto result = boPmPlanService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PmPlan>> create(@RequestBody PmPlan body) {
        PmPlan result = boPmPlanService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanDto>> update(@PathVariable("id") String id, @RequestBody PmPlan body) {
        PmPlanDto result = boPmPlanService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanDto>> upsert(@PathVariable("id") String id, @RequestBody PmPlan body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmPlanService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmPlanDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        PmPlanDto result = boPmPlanService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmPlan> rows) {
        boPmPlanService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}