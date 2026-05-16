package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmVoucherService;
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
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
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

    /* 바우처(상품권) 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmVoucher> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
