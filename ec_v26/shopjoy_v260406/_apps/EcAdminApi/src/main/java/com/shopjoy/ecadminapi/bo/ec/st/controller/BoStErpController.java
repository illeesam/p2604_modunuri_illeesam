package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherRepository;
import com.shopjoy.ecadminapi.base.ec.st.service.StErpVoucherService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    private final StErpVoucherService service;
    private final StErpVoucherRepository repository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StErpVoucherDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StErpVoucherDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @PostMapping("/gen")
    public ResponseEntity<ApiResponse<StErpVoucher>> gen(@RequestBody Map<String, Object> body) {
        StErpVoucher entity = new StErpVoucher();
        entity.setSettleYm((String) body.get("targetMon"));
        entity.setErpVoucherTypeCd((String) body.get("slipType"));
        entity.setErpVoucherStatusCd("PENDING");
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        StErpVoucher result = service.create(entity);
        log.info("ERP 전표 생성 - id={}, targetMon={}", result.getErpVoucherId(), body.get("targetMon"));
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/recon/{id}/fix")
    public ResponseEntity<ApiResponse<Void>> reconFix(@PathVariable("id") String id) {
        log.info("ERP 대사 수정 요청 - reconId={}", id);
        return ResponseEntity.ok(ApiResponse.ok(null, "수정되었습니다."));
    }

    @PostMapping("/resend/{id}")
    public ResponseEntity<ApiResponse<Void>> resend(@PathVariable("id") String id) {
        StErpVoucher entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 전표입니다: " + id));
        entity.setErpVoucherStatusCd("PENDING");
        entity.setErpSendDate(null);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        service.save(entity);
        log.info("ERP 전표 재전송 요청 - slipId={}", id);
        return ResponseEntity.ok(ApiResponse.ok(null, "재전송 요청되었습니다."));
    }
}
