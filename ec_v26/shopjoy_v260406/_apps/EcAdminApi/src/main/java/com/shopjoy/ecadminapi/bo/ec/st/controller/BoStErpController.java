package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStErpService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO ERP 전표 API — /api/bo/ec/st/erp
 */
@Slf4j
@RestController
@RequestMapping("/api/bo/ec/st/erp")
@RequiredArgsConstructor
public class BoStErpController {

    private final BoStErpService boStErpService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StErpVoucherDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStErpService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StErpVoucherDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStErpService.getPageData(p)));
    }

    /** genPage */
    @GetMapping("/gen/page")
    public ResponseEntity<ApiResponse<PageResult<StErpVoucherDto>>> genPage(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStErpService.getPageData(p)));
    }

    /** reconPage */
    @GetMapping("/recon/page")
    public ResponseEntity<ApiResponse<PageResult<StReconDto>>> reconPage(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStErpService.getReconPageData(p)));
    }

    /** gen */
    @PostMapping("/gen")
    public ResponseEntity<ApiResponse<StErpVoucher>> gen(@RequestBody Map<String, Object> body) {
        StErpVoucher result = boStErpService.gen(
            (String) body.get("targetMon"),
            (String) body.get("slipType")
        );
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** reconFix */
    @PutMapping("/recon/{id}/fix")
    public ResponseEntity<ApiResponse<Void>> reconFix(@PathVariable("id") String id) {
        log.info("ERP 대사 수정 요청 - reconId={}", id);
        return ResponseEntity.ok(ApiResponse.ok(null, "수정되었습니다."));
    }

    /** resend */
    @PostMapping("/resend/{id}")
    public ResponseEntity<ApiResponse<Void>> resend(@PathVariable("id") String id) {
        boStErpService.resend(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "재전송 요청되었습니다."));
    }
}
