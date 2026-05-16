package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.service.StErpVoucherLineService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/erp-voucher-line")
@RequiredArgsConstructor
public class StErpVoucherLineController {

    private final StErpVoucherLineService service;

    /* ERP 전표 상세 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StErpVoucherLineDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* ERP 전표 상세 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StErpVoucherLineDto.Item>>> list(@Valid @ModelAttribute StErpVoucherLineDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* ERP 전표 상세 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StErpVoucherLineDto.PageResponse>> page(@Valid @ModelAttribute StErpVoucherLineDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* ERP 전표 상세 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StErpVoucherLine>> create(@RequestBody StErpVoucherLine entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* ERP 전표 상세 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StErpVoucherLine>> save(@PathVariable("id") String id, @RequestBody StErpVoucherLine entity) {
        entity.setErpVoucherLineId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* ERP 전표 상세 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StErpVoucherLine>> updateSelective(@PathVariable("id") String id, @RequestBody StErpVoucherLine entity) {
        entity.setErpVoucherLineId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* ERP 전표 상세 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ERP 전표 상세 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StErpVoucherLine> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
