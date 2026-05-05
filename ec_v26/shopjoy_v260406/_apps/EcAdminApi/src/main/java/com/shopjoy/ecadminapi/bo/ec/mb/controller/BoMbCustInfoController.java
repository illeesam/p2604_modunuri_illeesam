package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbCustInfoService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 고객종합정보 API — /api/bo/ec/mb/cust-info
 */
@RestController
@RequestMapping("/api/bo/ec/mb/cust-info")
@RequiredArgsConstructor
public class BoMbCustInfoController {
    private final BoMbCustInfoService boMbCustInfoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.getPageData(p)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMember>> create(@RequestBody MbMember body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boMbCustInfoService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberDto>> update(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberDto>> upsert(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbCustInfoService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbCustInfoService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
