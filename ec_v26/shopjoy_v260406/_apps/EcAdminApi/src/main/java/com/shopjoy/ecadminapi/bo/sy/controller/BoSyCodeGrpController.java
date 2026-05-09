package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyCodeGrpService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 공통코드그룹 API — /api/bo/sy/code-grp
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/code-grp")
@RequiredArgsConstructor
public class BoSyCodeGrpController {
    private final BoSyCodeGrpService boSyCodeGrpService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrpDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeGrpService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeGrpDto.Item>>> list(@Valid @ModelAttribute SyCodeGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeGrpService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeGrpDto.PageResponse>> page(@Valid @ModelAttribute SyCodeGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeGrpService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyCodeGrp>> create(@RequestBody SyCodeGrp body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyCodeGrpService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrp>> update(@PathVariable("id") String id, @RequestBody SyCodeGrp body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeGrpService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrp>> upsert(@PathVariable("id") String id, @RequestBody SyCodeGrp body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeGrpService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyCodeGrpService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyCodeGrp>>> saveList(@RequestBody List<SyCodeGrp> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeGrpService.saveList(rows), "저장되었습니다."));
    }
}
