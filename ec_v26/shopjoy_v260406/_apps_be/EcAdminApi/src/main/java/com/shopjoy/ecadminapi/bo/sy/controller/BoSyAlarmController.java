package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAlarmService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 알람 API — /api/bo/sy/alarm
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/alarm")
@RequiredArgsConstructor
public class BoSyAlarmController {
    private final BoSyAlarmService boSyAlarmService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarmDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAlarmDto.Item>>> list(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAlarmDto.PageResponse>> page(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyAlarm>> create(@RequestBody SyAlarm body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyAlarmService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> update(@PathVariable("id") String id, @RequestBody SyAlarm body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> upsert(@PathVariable("id") String id, @RequestBody SyAlarm body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyAlarmService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyAlarm> rows) {
        switch (cmd) {
            case "base" -> boSyAlarmService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
    /** pathCounts — 표시경로 노드별 SyAlarm 수 (자손 누적, 트리 우측 뱃지용) */
    @GetMapping("/path-counts")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> pathCounts(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getPathTreeNodeCounts(req)));
    }

}
