package com.shopjoy.ecadminapi.autorest.controller;

import com.shopjoy.ecadminapi.autorest.comn.TableRegistry;
import com.shopjoy.ecadminapi.autorest.dto.BulkDeleteRequest;
import com.shopjoy.ecadminapi.autorest.dto.RowMap;
import com.shopjoy.ecadminapi.autorest.dto.SearchRequest;
import com.shopjoy.ecadminapi.autorest.service.AutoRestService;
import com.shopjoy.ecadminapi.common.exception.BusinessException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Generic REST controller — 9가지 표준 오퍼레이션
 * URL: /autoRest/{domain}/{sub}/{table}
 *
 * 1. GET    /autoRest/{d}/{s}/{table}         — 목록 조회 (전체)
 * 2. GET    /autoRest/{d}/{s}/{table}/page    — 페이지 조회
 * 3. GET    /autoRest/{d}/{s}/{table}/count   — 건수 조회
 * 4. GET    /autoRest/{d}/{s}/{table}/{id}    — 단건 조회
 * 5. POST   /autoRest/{d}/{s}/{table}         — 등록
 * 6. PUT    /autoRest/{d}/{s}/{table}/{id}    — 전체 수정
 * 7. PATCH  /autoRest/{d}/{s}/{table}/{id}    — 부분 수정
 * 8. DELETE /autoRest/{d}/{s}/{table}/{id}    — 단건 삭제
 * 9. DELETE /autoRest/{d}/{s}/{table}         — 일괄 삭제
 */
@RestController
@RequestMapping("/autoRest/{domain}/{sub}/{table}")
@RequiredArgsConstructor
public class AutoRestController {

    private final AutoRestService service;

    /* ── 1. 목록 조회 ── */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RowMap>>> list(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @ModelAttribute SearchRequest search) {
        checkTable(table);
        return ResponseEntity.ok(ApiResponse.ok(service.list(table, search)));
    }

    /* ── 2. 페이지 조회 ── */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<RowMap>>> page(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @ModelAttribute SearchRequest search) {
        checkTable(table);
        return ResponseEntity.ok(ApiResponse.ok(service.page(table, search)));
    }

    /* ── 3. 건수 조회 ── */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> count(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @ModelAttribute SearchRequest search) {
        checkTable(table);
        return ResponseEntity.ok(ApiResponse.ok(service.count(table, search)));
    }

    /* ── 4. 단건 조회 ── */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RowMap>> getById(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @PathVariable String id) {
        checkTable(table);
        RowMap row = service.getById(table, id);
        if (row == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(row));
    }

    /* ── 5. 등록 ── */
    @PostMapping
    public ResponseEntity<ApiResponse<RowMap>> create(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @RequestBody RowMap body) {
        checkTable(table);
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(table, body)));
    }

    /* ── 6. 전체 수정 ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RowMap>> update(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @PathVariable String id,
            @RequestBody RowMap body) {
        checkTable(table);
        return ResponseEntity.ok(ApiResponse.ok(service.update(table, id, body)));
    }

    /* ── 7. 부분 수정 ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<RowMap>> patch(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @PathVariable String id,
            @RequestBody RowMap body) {
        checkTable(table);
        return ResponseEntity.ok(ApiResponse.ok(service.patch(table, id, body)));
    }

    /* ── 8. 단건 삭제 ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @PathVariable String id) {
        checkTable(table);
        service.delete(table, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ── 9. 일괄 삭제 ── */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Integer>> bulkDelete(
            @PathVariable String domain,
            @PathVariable String sub,
            @PathVariable String table,
            @RequestBody @Valid BulkDeleteRequest req) {
        checkTable(table);
        int cnt = service.bulkDelete(table, req.getIds());
        return ResponseEntity.ok(ApiResponse.ok(cnt, cnt + "건 삭제되었습니다."));
    }

    private void checkTable(String table) {
        if (!TableRegistry.isSafeIdentifier(table)) {
            throw new BusinessException("유효하지 않은 테이블명입니다: " + table);
        }
    }
}
