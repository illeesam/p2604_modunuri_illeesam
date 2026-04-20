package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.vo.SyAlarmReq;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.service.SyAlarmService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 알람 API
 * GET    /api/base/sy/alarm           — 전체 목록
 * GET    /api/base/sy/alarm/page      — 페이징 목록
 * GET    /api/base/sy/alarm/{id}      — 단건 조회
 * POST   /api/base/sy/alarm           — 등록 (JPA)
 * PUT    /api/base/sy/alarm/{id}      — 전체 수정 (JPA)
 * PATCH  /api/base/sy/alarm/{id}      — 선택 필드 수정 (MyBatis)
 * DELETE /api/base/sy/alarm/{id}      — 삭제 (JPA)
 * POST   /api/base/sy/alarm/save      — _row_status 단건 저장 (I/U/D)
 * POST   /api/base/sy/alarm/save-list — _row_status 목록 저장 (I/U/D)
 */
@RestController
@RequestMapping("/api/base/sy/alarm")
@RequiredArgsConstructor
public class SyAlarmController {

    private final SyAlarmService service;

    /* ── 전체 목록 ── */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAlarmDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String typeCd,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort) {
        Map<String, Object> p = buildParam(siteId, kw, status, typeCd, dateStart, dateEnd, sort);
        List<SyAlarmDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 페이징 목록 ── */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyAlarmDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String typeCd,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Map<String, Object> p = buildParam(siteId, kw, status, typeCd, dateStart, dateEnd, sort);
        PageResult<SyAlarmDto> result = service.getPageData(p, pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 단건 조회 ── */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarmDto>> getById(@PathVariable String id) {
        SyAlarmDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<SyAlarm>> create(@RequestBody SyAlarm entity) {
        SyAlarm result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> save(
            @PathVariable String id,
            @RequestBody SyAlarm entity) {
        entity.setAlarmId(id);
        SyAlarm result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id,
            @RequestBody SyAlarm entity) {
        entity.setAlarmId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ── _row_status 단건 저장 ── */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyAlarm>> saveByRowStatus(@RequestBody @Valid SyAlarmReq req) {
        SyAlarm result = service.saveByRowStatus(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── _row_status 목록 저장 ── */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyAlarm>>> saveListByRowStatus(@RequestBody @Valid List<SyAlarmReq> list) {
        List<SyAlarm> result = service.saveListByRowStatus(list);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildParam(String siteId, String kw, String status, String typeCd,
                                           String dateStart, String dateEnd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId    != null) p.put("siteId",    siteId);
        if (kw        != null) p.put("kw",        kw);
        if (status    != null) p.put("status",    status);
        if (typeCd    != null) p.put("typeCd",    typeCd);
        if (dateStart != null) p.put("dateStart", dateStart);
        if (dateEnd   != null) p.put("dateEnd",   dateEnd);
        if (sort      != null) p.put("sort",      sort);
        return p;
    }
}
