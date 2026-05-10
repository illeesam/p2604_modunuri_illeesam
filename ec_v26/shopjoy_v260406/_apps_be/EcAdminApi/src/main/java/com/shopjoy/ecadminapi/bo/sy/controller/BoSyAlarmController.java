package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAlarmService;
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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarmDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAlarmDto.Item>>> list(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAlarmDto.PageResponse>> page(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyAlarm>> create(@RequestBody SyAlarm body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyAlarmService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> update(@PathVariable("id") String id, @RequestBody SyAlarm body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> upsert(@PathVariable("id") String id, @RequestBody SyAlarm body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAlarmService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyAlarmService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyAlarm> rows) {
        boSyAlarmService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
