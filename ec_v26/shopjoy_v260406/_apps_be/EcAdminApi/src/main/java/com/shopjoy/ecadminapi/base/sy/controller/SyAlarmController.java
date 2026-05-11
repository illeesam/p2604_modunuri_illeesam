package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.vo.SyAlarmReq;
import com.shopjoy.ecadminapi.base.sy.service.SyAlarmService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 알람 API
 * GET    /api/base/sy/alarm/{id}      — 단건 조회
 * GET    /api/base/sy/alarm           — 전체 목록
 * GET    /api/base/sy/alarm/page      — 페이징 목록
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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarmDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAlarmDto.Item>>> list(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAlarmDto.PageResponse>> page(@Valid @ModelAttribute SyAlarmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyAlarm>> create(@RequestBody SyAlarm entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> save(@PathVariable("id") String id, @RequestBody SyAlarm entity) {
        entity.setAlarmId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAlarm>> updateSelective(@PathVariable("id") String id, @RequestBody SyAlarm entity) {
        entity.setAlarmId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyAlarm>> saveByRowStatus(@RequestBody @Valid SyAlarmReq req) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveByRowStatus(req)));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyAlarm>>> saveListByRowStatus(@RequestBody @Valid List<SyAlarmReq> list) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveListByRowStatus(list)));
    }
}
