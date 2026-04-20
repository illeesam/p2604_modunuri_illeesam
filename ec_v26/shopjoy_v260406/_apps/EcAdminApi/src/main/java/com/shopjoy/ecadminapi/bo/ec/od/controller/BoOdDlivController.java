package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdDlivService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 배송 API
 * GET    /api/bo/ec/ord/dliv       — 목록
 * GET    /api/bo/ec/ord/dliv/page  — 페이징
 * GET    /api/bo/ec/ord/dliv/{id}  — 단건
 * POST   /api/bo/ec/ord/dliv       — 등록
 * PUT    /api/bo/ec/ord/dliv/{id}  — 수정
 * DELETE /api/bo/ec/ord/dliv/{id}  — 삭제
 * PATCH  /api/bo/ec/ord/dliv/{id}/status — 상태변경
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/ord/dliv")
@RequiredArgsConstructor
@UserOnly
public class BoOdDlivController {
    private final BoOdDlivService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<OdDlivDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdDlivDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<OdDlivDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdDliv>> create(@RequestBody OdDliv body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto>> update(@PathVariable String id, @RequestBody OdDliv body) {
        OdDlivDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OdDlivDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        OdDlivDto result = service.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
