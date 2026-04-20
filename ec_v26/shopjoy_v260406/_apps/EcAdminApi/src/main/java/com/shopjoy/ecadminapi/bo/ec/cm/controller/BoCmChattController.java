package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmChattService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
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
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<CmChattRoomDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmChattRoomDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<CmChattRoomDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmChattRoom>> create(@RequestBody CmChattRoom body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> update(@PathVariable String id, @RequestBody CmChattRoom body) {
        CmChattRoomDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        CmChattRoomDto result = service.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
