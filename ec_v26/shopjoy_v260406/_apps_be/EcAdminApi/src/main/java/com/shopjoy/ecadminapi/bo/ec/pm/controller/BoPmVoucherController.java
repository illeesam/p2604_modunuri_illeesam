package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherSendSnsDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmVoucherService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmVoucherDto.Item>>> list(@Valid @ModelAttribute PmVoucherDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmVoucherService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmVoucherDto.PageResponse>> page(@Valid @ModelAttribute PmVoucherDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmVoucherService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherDto.Item>> getById(@PathVariable("id") String id) {
        PmVoucherDto.Item result = boPmVoucherService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmVoucher>> create(@RequestBody PmVoucher body) {
        PmVoucher result = boPmVoucherService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucher>> update(@PathVariable("id") String id, @RequestBody PmVoucher body) {
        PmVoucher result = boPmVoucherService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucher>> upsert(@PathVariable("id") String id, @RequestBody PmVoucher body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmVoucherService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmVoucherService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmVoucherDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody PmVoucherChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmVoucherService.changeStatus(id, req.getStatusCd())));
    }

    /** sendSns — 전송 */
    @PostMapping("/{id}/send-sns")
    public ResponseEntity<ApiResponse<Void>> sendSns(
            @PathVariable("id") String id, @RequestBody PmVoucherSendSnsDto.Request req) {
        boPmVoucherService.sendSns(id, req);
        return ResponseEntity.ok(ApiResponse.ok(null, "발송되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmVoucher> rows) {
        boPmVoucherService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}