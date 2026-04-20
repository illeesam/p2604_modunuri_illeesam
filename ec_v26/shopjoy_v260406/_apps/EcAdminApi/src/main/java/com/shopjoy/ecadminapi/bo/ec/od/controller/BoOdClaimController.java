package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdClaimService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 클레임 API
 * GET    /api/bo/ec/ord/claim       — 목록
 * GET    /api/bo/ec/ord/claim/page  — 페이징
 * GET    /api/bo/ec/ord/claim/{id}  — 단건
 * POST   /api/bo/ec/ord/claim       — 등록
 * PUT    /api/bo/ec/ord/claim/{id}  — 수정
 * DELETE /api/bo/ec/ord/claim/{id}  — 삭제
 * PATCH  /api/bo/ec/ord/claim/{id}/status — 상태변경
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/ord/claim")
@RequiredArgsConstructor
@UserOnly
public class BoOdClaimController {
    private final BoOdClaimService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdClaimDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<OdClaimDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdClaimDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<OdClaimDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdClaim>> create(@RequestBody OdClaim body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimDto>> update(@PathVariable String id, @RequestBody OdClaim body) {
        OdClaimDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OdClaimDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        OdClaimDto result = service.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
