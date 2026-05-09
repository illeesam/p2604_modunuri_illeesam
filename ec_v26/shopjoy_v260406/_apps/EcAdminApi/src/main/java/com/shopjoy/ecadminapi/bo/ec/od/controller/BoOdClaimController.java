package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdClaimService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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
    private final BoOdClaimService boOdClaimService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdClaimDto.Item>>> list(@Valid @ModelAttribute OdClaimDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdClaimService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdClaimDto.PageResponse>> page(@Valid @ModelAttribute OdClaimDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdClaimService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimDto.Item>> getById(@PathVariable("id") String id) {
        OdClaimDto.Item result = boOdClaimService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdClaim>> create(@RequestBody OdClaim body) {
        OdClaim result = boOdClaimService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaim>> update(@PathVariable("id") String id, @RequestBody OdClaim body) {
        OdClaim result = boOdClaimService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaim>> upsert(@PathVariable("id") String id, @RequestBody OdClaim body) {
        return ResponseEntity.ok(ApiResponse.ok(boOdClaimService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boOdClaimService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OdClaimDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(boOdClaimService.changeStatus(id, body.get("statusCd"))));
    }

    /** bulkStatus */
    @PutMapping("/bulk-status")
    public ResponseEntity<ApiResponse<Void>> bulkStatus(@RequestBody Map<String, Object> body) {
        boOdClaimService.bulkStatus(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "상태가 변경되었습니다."));
    }

    /** bulkType */
    @PutMapping("/bulk-type")
    public ResponseEntity<ApiResponse<Void>> bulkType(@RequestBody Map<String, Object> body) {
        boOdClaimService.bulkType(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "유형이 변경되었습니다."));
    }

    /** bulkApproval */
    @PutMapping("/bulk-approval")
    public ResponseEntity<ApiResponse<Void>> bulkApproval(@RequestBody Map<String, Object> body) {
        boOdClaimService.bulkApproval(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "결재 처리되었습니다."));
    }

    /** bulkApprovalReq */
    @PutMapping("/bulk-approvalReq")
    public ResponseEntity<ApiResponse<Void>> bulkApprovalReq(@RequestBody Map<String, Object> body) {
        boOdClaimService.bulkApprovalReq(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "추가결재가 요청되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<OdClaim>>> saveList(@RequestBody List<OdClaim> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boOdClaimService.saveList(rows), "저장되었습니다."));
    }
}