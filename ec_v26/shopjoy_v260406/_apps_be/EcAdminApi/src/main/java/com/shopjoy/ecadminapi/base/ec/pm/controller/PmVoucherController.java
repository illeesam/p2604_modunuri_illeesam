package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmVoucherService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/voucher")
@RequiredArgsConstructor
public class PmVoucherController {

    private final PmVoucherService service;

    /* 바우처(상품권) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 바우처(상품권) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmVoucherDto.Item>>> list(@Valid @ModelAttribute PmVoucherDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 바우처(상품권) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmVoucherDto.PageResponse>> page(@Valid @ModelAttribute PmVoucherDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 바우처(상품권) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmVoucher>> create(@RequestBody PmVoucher entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 바우처(상품권) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucher>> save(@PathVariable("id") String id, @RequestBody PmVoucher entity) {
        entity.setVoucherId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 바우처(상품권) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucher>> updateSelective(@PathVariable("id") String id, @RequestBody PmVoucher entity) {
        entity.setVoucherId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 바우처(상품권) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmVoucher>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmVoucher entity) {
        PmVoucher result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmVoucher> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
