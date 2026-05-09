package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO MbMember API — /api/bo/ec/mb/member
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member")
@RequiredArgsConstructor
public class BoMbMemberController {

    private final BoMbMemberService boMbMemberService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberDto.Item>>> list(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberDto.PageResponse>> page(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMember>> create(@RequestBody MbMember body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boMbMemberService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMember>> update(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMember>> upsert(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbMemberService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<MbMember>>> saveList(@RequestBody List<MbMember> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.saveList(rows), "저장되었습니다."));
    }
}
