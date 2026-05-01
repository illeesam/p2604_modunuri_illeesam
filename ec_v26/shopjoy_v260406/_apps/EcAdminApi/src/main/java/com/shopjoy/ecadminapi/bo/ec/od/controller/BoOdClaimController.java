package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdClaimService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 클레임 API
 * GET    /api/bo/ec/od/claim       — 목록
 * GET    /api/bo/ec/od/claim/page  — 페이징
 * GET    /api/bo/ec/od/claim/{id}  — 단건
 * POST   /api/bo/ec/od/claim       — 등록
 * PUT    /api/bo/ec/od/claim/{id}  — 수정
 * DELETE /api/bo/ec/od/claim/{id}  — 삭제
 * PATCH  /api/bo/ec/od/claim/{id}/status — 상태변경
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/od/claim")
@RequiredArgsConstructor
public class BoOdClaimController {
    private final BoOdClaimService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdClaimDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<OdClaimDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdClaimDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<OdClaimDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimDto>> getById(@PathVariable String id) {
        OdClaimDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdClaim>> create(@RequestBody OdClaim body) {
        OdClaim result = service.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimDto>> update(@PathVariable String id, @RequestBody OdClaim body) {
        OdClaimDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimDto>> upsert(@PathVariable String id, @RequestBody OdClaim body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
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

    @PutMapping("/bulk-status")
    public ResponseEntity<ApiResponse<Void>> bulkStatus(@RequestBody Map<String, Object> body) {
        service.bulkStatus(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "상태가 변경되었습니다."));
    }

    @PutMapping("/bulk-type")
    public ResponseEntity<ApiResponse<Void>> bulkType(@RequestBody Map<String, Object> body) {
        service.bulkType(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "유형이 변경되었습니다."));
    }

    @PutMapping("/bulk-approval")
    public ResponseEntity<ApiResponse<Void>> bulkApproval(@RequestBody Map<String, Object> body) {
        service.bulkApproval(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "결재 처리되었습니다."));
    }

    @PutMapping("/bulk-approvalReq")
    public ResponseEntity<ApiResponse<Void>> bulkApprovalReq(@RequestBody Map<String, Object> body) {
        service.bulkApprovalReq(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "추가결재가 요청되었습니다."));
    }
}
