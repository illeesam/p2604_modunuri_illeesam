package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.service.StErpVoucherService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/erp-voucher")
@RequiredArgsConstructor
public class StErpVoucherController {

    private final StErpVoucherService service;

    /* ERP 전표 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StErpVoucherDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* ERP 전표 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StErpVoucherDto.Item>>> list(@Valid @ModelAttribute StErpVoucherDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* ERP 전표 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StErpVoucherDto.PageResponse>> page(@Valid @ModelAttribute StErpVoucherDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* ERP 전표 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StErpVoucher>> create(@RequestBody StErpVoucher entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* ERP 전표 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StErpVoucher>> save(@PathVariable("id") String id, @RequestBody StErpVoucher entity) {
        entity.setErpVoucherId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* ERP 전표 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StErpVoucher>> updateSelective(@PathVariable("id") String id, @RequestBody StErpVoucher entity) {
        entity.setErpVoucherId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* ERP 전표 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ERP 전표 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StErpVoucher> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
