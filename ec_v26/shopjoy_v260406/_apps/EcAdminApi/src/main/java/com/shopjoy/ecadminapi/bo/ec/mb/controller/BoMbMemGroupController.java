package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemGroupService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 회원그룹 API
 * GET    /api/bo/ec/mb/member-group       — 목록
 * GET    /api/bo/ec/mb/member-group/page  — 페이징
 * GET    /api/bo/ec/mb/member-group/{id}  — 단건
 * POST   /api/bo/ec/mb/member-group       — 등록
 * PUT    /api/bo/ec/mb/member-group/{id}  — 수정
 * DELETE /api/bo/ec/mb/member-group/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-group")
@RequiredArgsConstructor
public class BoMbMemGroupController {
    private final BoMbMemGroupService boMbMemGroupService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGroupDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<MbMemberGroupDto> result = boMbMemGroupService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberGroupDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<MbMemberGroupDto> result = boMbMemGroupService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto>> getById(@PathVariable("id") String id) {
        MbMemberGroupDto result = boMbMemGroupService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGroup>> create(@RequestBody MbMemberGroup body) {
        MbMemberGroup result = boMbMemGroupService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto>> update(@PathVariable("id") String id, @RequestBody MbMemberGroup body) {
        MbMemberGroupDto result = boMbMemGroupService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto>> upsert(@PathVariable("id") String id, @RequestBody MbMemberGroup body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGroupService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbMemGroupService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberGroup> rows) {
        boMbMemGroupService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
