package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmChattService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 채팅 API
 * GET    /api/bo/ec/cm/chatt       — 목록
 * GET    /api/bo/ec/cm/chatt/page  — 페이징
 * GET    /api/bo/ec/cm/chatt/{id}  — 단건
 * POST   /api/bo/ec/cm/chatt       — 등록
 * PUT    /api/bo/ec/cm/chatt/{id}  — 수정
 * DELETE /api/bo/ec/cm/chatt/{id}  — 삭제
 * PATCH  /api/bo/ec/cm/chatt/{id}/status — 상태변경
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/chatt")
@RequiredArgsConstructor
@UserOnly
public class BoCmChattController {
    private final BoCmChattService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattRoomDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw, status, dateStart, dateEnd)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmChattRoomDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, status, dateStart, dateEnd, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmChattRoom>> create(@RequestBody CmChattRoom body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> update(@PathVariable String id, @RequestBody CmChattRoom body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.changeStatus(id, body.get("statusCd"))));
    }
}
