package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyCodeService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 공통코드 API — /api/bo/sy/code
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/code")
@RequiredArgsConstructor
@UserOnly
public class BoSyCodeController {
    private final BoSyCodeService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<SyCodeDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyCodeDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<SyCodeDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyCode>> create(@RequestBody SyCode body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto>> update(@PathVariable String id, @RequestBody SyCode body) {
        SyCodeDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
