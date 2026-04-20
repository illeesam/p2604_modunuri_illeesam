package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmBltnService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 게시글(블로그/BBS) API
 * GET    /api/bo/ec/cm/bltn       — 목록
 * GET    /api/bo/ec/cm/bltn/page  — 페이징
 * GET    /api/bo/ec/cm/bltn/{id}  — 단건
 * POST   /api/bo/ec/cm/bltn       — 등록
 * PUT    /api/bo/ec/cm/bltn/{id}  — 수정
 * DELETE /api/bo/ec/cm/bltn/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/bltn")
@RequiredArgsConstructor
@UserOnly
public class BoCmBltnController {
    private final BoCmBltnService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBltnDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<CmBltnDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmBltnDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<CmBltnDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmBltn>> create(@RequestBody CmBltn body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBltnDto>> update(@PathVariable String id, @RequestBody CmBltn body) {
        CmBltnDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
