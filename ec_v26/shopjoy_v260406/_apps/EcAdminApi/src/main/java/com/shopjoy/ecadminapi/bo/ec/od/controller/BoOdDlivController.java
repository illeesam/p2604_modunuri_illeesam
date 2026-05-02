package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdDlivService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 배송 API
 * GET    /api/bo/ec/od/dliv       — 목록
 * GET    /api/bo/ec/od/dliv/page  — 페이징
 * GET    /api/bo/ec/od/dliv/{id}  — 단건
 * POST   /api/bo/ec/od/dliv       — 등록
 * PUT    /api/bo/ec/od/dliv/{id}  — 수정
 * DELETE /api/bo/ec/od/dliv/{id}  — 삭제
 * PATCH  /api/bo/ec/od/dliv/{id}/status — 상태변경
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/od/dliv")
@RequiredArgsConstructor
public class BoOdDlivController {
    private final BoOdDlivService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<OdDlivDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdDlivDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<OdDlivDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto>> getById(@PathVariable String id) {
        OdDlivDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdDliv>> create(@RequestBody OdDliv body) {
        OdDliv result = service.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto>> update(@PathVariable String id, @RequestBody OdDliv body) {
        OdDlivDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto>> upsert(@PathVariable String id, @RequestBody OdDliv body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
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

    @PutMapping("/bulk-status")
    public ResponseEntity<ApiResponse<Void>> bulkStatus(@RequestBody Map<String, Object> body) {
        service.bulkStatus(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "상태가 변경되었습니다."));
    }

    @PutMapping("/bulk-courier")
    public ResponseEntity<ApiResponse<Void>> bulkCourier(@RequestBody Map<String, Object> body) {
        service.bulkCourier(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "택배정보가 변경되었습니다."));
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
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdDliv> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}