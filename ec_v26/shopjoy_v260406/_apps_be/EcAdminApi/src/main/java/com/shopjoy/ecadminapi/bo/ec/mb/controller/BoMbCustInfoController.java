package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbCustInfoService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 고객종합정보 API — /api/bo/ec/mb/cust-info
 */
@RestController
@RequestMapping("/api/bo/ec/mb/cust-info")
@RequiredArgsConstructor
public class BoMbCustInfoController {
    private final BoMbCustInfoService boMbCustInfoService;

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberDto.Item>>> list(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberDto.PageResponse>> page(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMember>> create(@RequestBody MbMember body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boMbCustInfoService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMember>> update(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMember>> upsert(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbCustInfoService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
