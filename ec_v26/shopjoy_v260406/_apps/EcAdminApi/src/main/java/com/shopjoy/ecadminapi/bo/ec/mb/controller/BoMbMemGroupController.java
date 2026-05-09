package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemGroupService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 회원그룹 API — /api/bo/ec/mb/member-group
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-group")
@RequiredArgsConstructor
public class BoMbMemGroupController {
    private final BoMbMemGroupService boMbMemGroupService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGroupService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGroupDto.Item>>> list(@Valid @ModelAttribute MbMemberGroupDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGroupService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberGroupDto.PageResponse>> page(@Valid @ModelAttribute MbMemberGroupDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGroupService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGroup>> create(@RequestBody MbMemberGroup body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boMbMemGroupService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroup>> update(@PathVariable("id") String id, @RequestBody MbMemberGroup body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGroupService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroup>> upsert(@PathVariable("id") String id, @RequestBody MbMemberGroup body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGroupService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbMemGroupService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberGroup> rows) {
        boMbMemGroupService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
