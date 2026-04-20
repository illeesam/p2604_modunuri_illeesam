package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemGroupService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 회원그룹 API
 * GET    /api/bo/ec/mb/mem-group       — 목록
 * GET    /api/bo/ec/mb/mem-group/page  — 페이징
 * GET    /api/bo/ec/mb/mem-group/{id}  — 단건
 * POST   /api/bo/ec/mb/mem-group       — 등록
 * PUT    /api/bo/ec/mb/mem-group/{id}  — 수정
 * DELETE /api/bo/ec/mb/mem-group/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/mem-group")
@RequiredArgsConstructor
@UserOnly
public class BoMbMemGroupController {
    private final BoMbMemGroupService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGroupDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberGroupDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGroup>> create(@RequestBody MbMemberGroup body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto>> update(@PathVariable String id, @RequestBody MbMemberGroup body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
