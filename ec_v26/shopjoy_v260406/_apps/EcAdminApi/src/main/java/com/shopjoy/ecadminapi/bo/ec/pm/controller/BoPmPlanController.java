package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmPlanService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmPlanDto.Item>>> list(@Valid @ModelAttribute PmPlanDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmPlanService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmPlanDto.PageResponse>> page(@Valid @ModelAttribute PmPlanDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmPlanService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanDto.Item>> getById(@PathVariable("id") String id) {
        PmPlanDto.Item result = boPmPlanService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmPlan>> create(@RequestBody PmPlan body) {
        PmPlan result = boPmPlanService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlan>> update(@PathVariable("id") String id, @RequestBody PmPlan body) {
        PmPlan result = boPmPlanService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlan>> upsert(@PathVariable("id") String id, @RequestBody PmPlan body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmPlanService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmPlanDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmPlanService.changeStatus(id, body.get("statusCd"))));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmPlan> rows) {
        boPmPlanService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}