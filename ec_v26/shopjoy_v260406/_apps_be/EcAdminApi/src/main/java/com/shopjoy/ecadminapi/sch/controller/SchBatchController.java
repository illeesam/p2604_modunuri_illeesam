package com.shopjoy.ecadminapi.sch.controller;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.sch.config.SchBatchProperties;
import com.shopjoy.ecadminapi.sch.core.SchBatchExecutor;
import com.shopjoy.ecadminapi.sch.core.SchBatchJobRegistry;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 스케줄러 관리 API
 *
 * [관리자 전용 - @BoOnly + IP 화이트리스트]
 *   GET  /api/sch/batch                  — 전체 배치 목록 + 등록 상태 + 실행 모드
 *   POST /api/sch/batch/{code}/run       — 핸들러 직접 즉시 실행 (cron 무관)
 *   POST /api/sch/batch/{code}/on        — cron 스케줄 등록
 *   POST /api/sch/batch/{code}/off       — cron 스케줄 해제
 *   POST /api/sch/reload                 — DB 재로드 후 전체 재등록
 *
 * [Jenkins 외부 호출 - 토큰 인증 + IP 화이트리스트]
 *   POST /api/sch/jenkins/{code}         — Jenkins가 직접 호출하는 배치 실행 엔드포인트
 *                                          Header: X-Jenkins-Token: {app.scheduler.jenkins.token}
 *                                          조건:   app.scheduler.jenkins.enabled=true 일 때만 허용
 *
 * [IP 화이트리스트 (app.scheduler.allowed-ips)]
 *   ""  또는 미설정 — 전체 허용
 *   "*"             — 전체 허용
 *   "A^B^C"         — ^ 구분 IP 목록만 허용 (관리자 API + Jenkins API 공통 적용)
 *   X-Forwarded-For 헤더가 있으면 프록시 뒤 실제 클라이언트 IP로 판단.
 *
 * [실행 모드 비교]
 *   jenkins.enabled=false (기본) : cron 자동 스케줄 → 내부 ThreadPool 실행
 *   jenkins.enabled=true         : cron 등록 생략   → Jenkins가 /api/sch/jenkins/* 직접 호출
 */
@Slf4j
@RestController
@RequestMapping("/api/sch")
@RequiredArgsConstructor
public class SchBatchController {

    private static final String JENKINS_TOKEN_HEADER = "X-Jenkins-Token";

    private final SyBatchRepository  batchRepository;
    private final SchBatchJobRegistry registry;
    private final SchBatchExecutor    executor;
    private final SchBatchProperties  properties;

    // ════════════════════════════════════════════════════════════════
    // 관리자 전용 API (@BoOnly + IP 화이트리스트)
    // ════════════════════════════════════════════════════════════════

    /* 목록조회 */
    @GetMapping("/batch")
    @SuppressWarnings({"unchecked", "rawtypes"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(HttpServletRequest req) {
        ResponseEntity<ApiResponse<Void>> ipDenied = checkIp(req);
        if (ipDenied != null) return (ResponseEntity<ApiResponse<List<Map<String, Object>>>>) (ResponseEntity) ipDenied;

        boolean jenkinsMode = properties.getJenkins().isEnabled();
        List<Map<String, Object>> result = batchRepository.findAll().stream()
            .map(b -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("batchId",        b.getBatchId());
                m.put("batchCode",      b.getBatchCode());
                m.put("batchNm",        CmUtil.nvl(b.getBatchNm()));
                m.put("cronExpr",       CmUtil.nvl(b.getCronExpr()));
                m.put("batchStatusCd",  CmUtil.nvl(b.getBatchStatusCd()));
                m.put("batchRunStatus", CmUtil.nvl(b.getBatchRunStatus()));
                m.put("batchLastRun",   b.getBatchLastRun() != null ? b.getBatchLastRun().toString() : "");
                m.put("batchNextRun",   b.getBatchNextRun() != null ? b.getBatchNextRun().toString() : "");
                m.put("batchRunCount",  CmUtil.nvlInt(b.getBatchRunCount()));
                m.put("registered",     registry.isRegistered(b.getBatchCode()));
                m.put("execMode",       jenkinsMode ? "JENKINS" : "CRON");
                return m;
            })
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(result,
            "실행모드: " + (jenkinsMode ? "JENKINS (외부호출)" : "CRON (내부스케줄)")));
    }

    /** 핸들러 직접 즉시 실행 — cron 스케줄 등록 여부·실행 모드 무관하게 강제 실행 */
    @PostMapping("/batch/{batchCode}/run")
    public ResponseEntity<ApiResponse<Void>> run(
            @PathVariable("batchCode") String batchCode,
            HttpServletRequest req) {
        ResponseEntity<ApiResponse<Void>> ipDenied = checkIp(req);
        if (ipDenied != null) return ipDenied;

        SyBatch batch = findBatch(batchCode);
        log.info("[SCH-API] 수동 즉시 실행: batchCode={} ip={}", batchCode, resolveIp(req));
        executor.execute(batch);
        return ResponseEntity.ok(ApiResponse.ok(null, batchCode + " 즉시 실행 완료"));
    }

    /** cron 스케줄 등록 (Jenkins 모드에서는 등록이 생략됨) */
    @PostMapping("/batch/{batchCode}/on")
    public ResponseEntity<ApiResponse<Void>> on(
            @PathVariable("batchCode") String batchCode,
            HttpServletRequest req) {
        ResponseEntity<ApiResponse<Void>> ipDenied = checkIp(req);
        if (ipDenied != null) return ipDenied;

        SyBatch batch = findBatch(batchCode);
        registry.register(batch);
        boolean jenkinsMode = properties.getJenkins().isEnabled();
        String msg = jenkinsMode
            ? batchCode + " Jenkins 모드 - cron 등록 생략 (외부 호출 대기)"
            : batchCode + " cron 스케줄 등록됨";
        return ResponseEntity.ok(ApiResponse.ok(null, msg));
    }

    /** cron 스케줄 해제 */
    @PostMapping("/batch/{batchCode}/off")
    public ResponseEntity<ApiResponse<Void>> off(
            @PathVariable("batchCode") String batchCode,
            HttpServletRequest req) {
        ResponseEntity<ApiResponse<Void>> ipDenied = checkIp(req);
        if (ipDenied != null) return ipDenied;

        registry.unregister(batchCode);
        return ResponseEntity.ok(ApiResponse.ok(null, batchCode + " cron 스케줄 해제됨"));
    }

    /** DB 재로드 후 전체 배치 재등록 */
    @PostMapping("/reload")
    @SuppressWarnings({"unchecked", "rawtypes"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> reload(HttpServletRequest req) {
        ResponseEntity<ApiResponse<Void>> ipDenied = checkIp(req);
        if (ipDenied != null) return (ResponseEntity<ApiResponse<Map<String, Object>>>) (ResponseEntity) ipDenied;

        registry.unregisterAll();
        List<SyBatch> active = batchRepository.findByBatchStatusCd("ACTIVE");
        active.forEach(registry::register);
        boolean jenkinsMode = properties.getJenkins().isEnabled();
        return ResponseEntity.ok(ApiResponse.ok(
            Map.of(
                "registered",       registry.registeredCount(),
                "schedulerEnabled", properties.isEnabled(),
                "execMode",         jenkinsMode ? "JENKINS" : "CRON"
            ),
            "재로드 완료"
        ));
    }

    // ════════════════════════════════════════════════════════════════
    // Jenkins 외부 호출 엔드포인트 (토큰 인증 + IP 화이트리스트)
    // ════════════════════════════════════════════════════════════════

    /**
     * Jenkins Pipeline에서 호출하는 배치 실행 엔드포인트.
     *
     * 조건:
     *   1. app.scheduler.jenkins.enabled=true
     *   2. Header X-Jenkins-Token 값이 app.scheduler.jenkins.token 과 일치
     *   3. 요청 IP가 app.scheduler.allowed-ips 화이트리스트에 포함
     *
     * Jenkins Pipeline 예시:
     *   httpRequest(
     *     url: "http://app-host/api/sch/jenkins/COUPON_EXPIRE",
     *     httpMode: "POST",
     *     customHeaders: [[name: "X-Jenkins-Token", value: "${JENKINS_BATCH_TOKEN}"]]
     *   )
     */
    @PostMapping("/jenkins/{batchCode}")
    public ResponseEntity<ApiResponse<Void>> jenkinsRun(
            @PathVariable("batchCode") String batchCode,
            @RequestHeader(value = JENKINS_TOKEN_HEADER, required = false) String token,
            HttpServletRequest req) {

        // Jenkins 모드 비활성 시 403
        if (!properties.getJenkins().isEnabled()) {
            log.warn("[SCH-JENKINS] Jenkins 모드 비활성 상태에서 호출 시도: batchCode={} ip={}", batchCode, resolveIp(req));
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "Jenkins 실행 모드가 비활성 상태입니다. (app.scheduler.jenkins.enabled=false)"));
        }

        // IP 화이트리스트 검증
        ResponseEntity<ApiResponse<Void>> ipDenied = checkIp(req);
        if (ipDenied != null) return ipDenied;

        // 토큰 검증
        if (properties.getJenkins().hasToken() && !properties.getJenkins().isTokenValid(token)) {
            log.warn("[SCH-JENKINS] 토큰 불일치: batchCode={} ip={}", batchCode, resolveIp(req));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(401, "X-Jenkins-Token 인증 실패"));
        }

        SyBatch batch = findBatch(batchCode);
        log.info("[SCH-JENKINS] Jenkins 외부 호출 실행: batchCode={} ip={}", batchCode, resolveIp(req));
        executor.execute(batch);
        return ResponseEntity.ok(ApiResponse.ok(null, "[JENKINS] " + batchCode + " 실행 완료"));
    }

    // ────────────────────────────────────────────────────────────────
    // 내부 유틸
    // ────────────────────────────────────────────────────────────────

    /**
     * IP 화이트리스트 검증.
     * allowed-ips 가 비어있거나 "*" 이면 통과(null 반환).
     * 목록에 없는 IP 면 403 ResponseEntity 반환 → 호출부에서 즉시 return.
     */
    private ResponseEntity<ApiResponse<Void>> checkIp(HttpServletRequest req) {
        String ip = resolveIp(req);
        if (!properties.isIpAllowed(ip)) {
            log.warn("[SCH] 허용되지 않은 IP 접근 차단: ip={}", ip);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "허용되지 않은 IP입니다: " + ip));
        }
        return null;
    }

    /**
     * 실제 클라이언트 IP 추출.
     * 리버스 프록시(Nginx/L4) 뒤에서는 X-Forwarded-For 의 첫 번째 값을 사용.
     */
    private String resolveIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    /** findBatch */
    private SyBatch findBatch(String batchCode) {
        return batchRepository.findByBatchCode(batchCode)
            .orElseThrow(() -> new CmBizException("배치를 찾을 수 없습니다: " + batchCode));
    }
}
