package com.shopjoy.ecadminapi.sch.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.sch.config.SchProperties;
import com.shopjoy.ecadminapi.sch.core.SchExecutor;
import com.shopjoy.ecadminapi.sch.core.SchJobRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 스케줄러 관리 API (관리자 전용)
 * GET  /api/sch/batch              — 전체 배치 목록 + 등록 상태
 * POST /api/sch/batch/{code}/run   — 즉시 실행
 * POST /api/sch/batch/{code}/on    — 스케줄 등록
 * POST /api/sch/batch/{code}/off   — 스케줄 해제
 * POST /api/sch/reload             — DB 재로드 후 전체 재등록
 */
@RestController
@RequestMapping("/sch")
@RequiredArgsConstructor
@BoOnly
public class SchController {

    private final SyBatchRepository batchRepository;
    private final SchJobRegistry    registry;
    private final SchExecutor       executor;
    private final SchProperties     properties;

    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        List<Map<String, Object>> result = batchRepository.findAll().stream()
            .map(b -> Map.<String, Object>of(
                "batchId",        b.getBatchId(),
                "batchCode",      b.getBatchCode(),
                "batchNm",        b.getBatchNm() != null ? b.getBatchNm() : "",
                "cronExpr",       b.getCronExpr() != null ? b.getCronExpr() : "",
                "batchStatusCd",  b.getBatchStatusCd() != null ? b.getBatchStatusCd() : "",
                "batchRunStatus", b.getBatchRunStatus() != null ? b.getBatchRunStatus() : "",
                "batchLastRun",   b.getBatchLastRun() != null ? b.getBatchLastRun().toString() : "",
                "batchNextRun",   b.getBatchNextRun() != null ? b.getBatchNextRun().toString() : "",
                "batchRunCount",  b.getBatchRunCount() != null ? b.getBatchRunCount() : 0,
                "registered",     registry.isRegistered(b.getBatchCode())
            ))
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/batch/{batchCode}/run")
    public ResponseEntity<ApiResponse<Void>> run(@PathVariable String batchCode) {
        SyBatch batch = findBatch(batchCode);
        executor.execute(batch);
        return ResponseEntity.ok(ApiResponse.ok(null, batchCode + " 즉시 실행 완료"));
    }

    @PostMapping("/batch/{batchCode}/on")
    public ResponseEntity<ApiResponse<Void>> on(@PathVariable String batchCode) {
        SyBatch batch = findBatch(batchCode);
        registry.register(batch);
        return ResponseEntity.ok(ApiResponse.ok(null, batchCode + " 스케줄 등록됨"));
    }

    @PostMapping("/batch/{batchCode}/off")
    public ResponseEntity<ApiResponse<Void>> off(@PathVariable String batchCode) {
        registry.unregister(batchCode);
        return ResponseEntity.ok(ApiResponse.ok(null, batchCode + " 스케줄 해제됨"));
    }

    @PostMapping("/reload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reload() {
        registry.unregisterAll();
        List<SyBatch> active = batchRepository.findByBatchStatusCd("ACTIVE");
        active.forEach(registry::register);
        return ResponseEntity.ok(ApiResponse.ok(
            Map.of("registered", registry.registeredCount(), "schedulerEnabled", properties.isEnabled()),
            "재로드 완료"
        ));
    }

    private SyBatch findBatch(String batchCode) {
        return batchRepository.findByBatchCode(batchCode)
            .orElseThrow(() -> new CmBizException("배치를 찾을 수 없습니다: " + batchCode));
    }
}
