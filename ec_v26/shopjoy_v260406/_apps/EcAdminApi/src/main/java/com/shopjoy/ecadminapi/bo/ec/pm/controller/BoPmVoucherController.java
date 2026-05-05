package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmVoucherService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 바우처 API — /api/bo/ec/pm/voucher
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/voucher")
@RequiredArgsConstructor
public class BoPmVoucherController {
    private final BoPmVoucherService boPmVoucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmVoucherDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PmVoucherDto> result = boPmVoucherService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmVoucherDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PmVoucherDto> result = boPmVoucherService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherDto>> getById(@PathVariable("id") String id) {
        PmVoucherDto result = boPmVoucherService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PmVoucher>> create(@RequestBody PmVoucher body) {
        PmVoucher result = boPmVoucherService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherDto>> update(@PathVariable("id") String id, @RequestBody PmVoucher body) {
        PmVoucherDto result = boPmVoucherService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherDto>> upsert(@PathVariable("id") String id, @RequestBody PmVoucher body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmVoucherService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmVoucherService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmVoucherDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        PmVoucherDto result = boPmVoucherService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}/send-sns")
    public ResponseEntity<ApiResponse<Void>> sendSns(
            @PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        boPmVoucherService.sendSns(id, body);
        return ResponseEntity.ok(ApiResponse.ok(null, "발송되었습니다."));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmVoucher> rows) {
        boPmVoucherService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}