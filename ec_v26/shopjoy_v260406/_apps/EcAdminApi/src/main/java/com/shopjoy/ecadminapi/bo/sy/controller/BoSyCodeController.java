package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyCodeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 공통코드 API — /api/bo/sy/code
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/code")
@RequiredArgsConstructor
public class BoSyCodeController {
    private final BoSyCodeService boSyCodeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<SyCodeDto> result = boSyCodeService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyCodeDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<SyCodeDto> result = boSyCodeService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto>> getById(@PathVariable("id") String id) {
        SyCodeDto result = boSyCodeService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyCode> rows) {
        boSyCodeService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyCode>> create(@RequestBody SyCode body) {
        SyCode result = boSyCodeService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto>> update(@PathVariable("id") String id, @RequestBody SyCode body) {
        SyCodeDto result = boSyCodeService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto>> upsert(@PathVariable("id") String id, @RequestBody SyCode body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyCodeService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
