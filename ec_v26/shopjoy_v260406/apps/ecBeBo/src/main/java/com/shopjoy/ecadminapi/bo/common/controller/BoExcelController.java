package com.shopjoy.ecadminapi.bo.common.controller;

import com.shopjoy.ecadminapi.bo.common.service.BoExcelService;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaInfo;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 엑셀 통합 컨트롤러 — 모든 도메인의 엑셀 다운로드/업로드 처리.
 *
 * <p>도메인별 컨트롤러 작성 불필요. 새 도메인은
 * {@link com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler} 빈 하나만 등록하면 즉시 사용 가능.
 *
 * <p>엔드포인트:
 * <ul>
 *   <li>{@code GET  /api/bo/excel/domains}              — 등록된 도메인 목록 조회 (select 옵션용)</li>
 *   <li>{@code GET  /api/bo/excel/{domain}/excel}        — 다운로드 (검색조건 query string)</li>
 *   <li>{@code POST /api/bo/excel/{domain}/exists-check} — 키 일괄 존재체크</li>
 *   <li>{@code POST /api/bo/excel/{domain}/upsert-list}  — 업로드(upsert)</li>
 * </ul>
 *
 * <p>인가: BO_ONLY (관리자). 도메인별 추가 권한 체크는 핸들러에서 처리 가능.
 */
@RestController
@RequestMapping("/api/bo/excel")
@RequiredArgsConstructor
public class BoExcelController {

    private final BoExcelService boExcelService;

    /** 등록된 도메인 목록 — 프론트 select 옵션 동적 생성용 */
    @GetMapping("/domains")
    public ResponseEntity<ApiResponse<Map<String, Object>>> domains() {
        return ResponseEntity.ok(ApiResponse.ok(boExcelService.domainList()));
    }

    /** 단일 도메인 컬럼 메타 — 프론트 [업로드 점검하기] 시 파일과 비교하여 호환성 검증 */
    @GetMapping("/{domain}/meta")
    public ResponseEntity<ApiResponse<ExcelMetaInfo>> meta(@PathVariable("domain") String domain) {
        return ResponseEntity.ok(ApiResponse.ok(boExcelService.getMeta(domain)));
    }

    /** 다운로드 — xlsx 스트리밍 */
    @GetMapping("/{domain}/excel")
    public void excel(@PathVariable("domain") String domain,
                      @RequestParam Map<String, Object> queryParams,
                      HttpServletResponse response) {
        boExcelService.exportExcel(domain, queryParams, response);
    }

    /** 키 일괄 존재체크 — body: {keys: [...]} → {existsMap: {...}} */
    @PostMapping("/{domain}/exists-check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> existsCheck(
            @PathVariable("domain") String domain,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> keys = (List<String>) body.getOrDefault("keys", List.of());
        Map<String, Boolean> existsMap = boExcelService.existsCheck(domain, keys);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("existsMap", existsMap)));
    }

    /** 업로드 — body: {rows: [...], testRun: false} → {inserted, updated, errors, testRun}.
     *  testRun=true 인 경우 정상 처리 흐름을 모두 수행한 뒤 트랜잭션을 롤백하여 DB 미반영.
     *  프론트의 [업로드점검] 버튼이 이 모드로 호출하여 행별 검증 결과를 받아간다. */
    @PostMapping("/{domain}/upsert-list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upsertList(
            @PathVariable("domain") String domain,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.getOrDefault("rows", List.of());
        boolean testRun = Boolean.TRUE.equals(body.get("testRun"));
        Map<String, Object> result = boExcelService.upsertList(domain, rows, testRun);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
