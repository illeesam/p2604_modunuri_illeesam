package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.service.OdRefundService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/refund")
@RequiredArgsConstructor
public class OdRefundController {

    private final OdRefundService service;

    /* 환불 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefundDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 환불 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdRefundDto.Item>>> list(@Valid @ModelAttribute OdRefundDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 환불 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdRefundDto.PageResponse>> page(@Valid @ModelAttribute OdRefundDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 환불 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdRefund>> create(@RequestBody OdRefund entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 환불 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefund>> save(@PathVariable("id") String id, @RequestBody OdRefund entity) {
        entity.setRefundId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 환불 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefund>> updateSelective(@PathVariable("id") String id, @RequestBody OdRefund entity) {
        entity.setRefundId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 환불 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 환불 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdRefund> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
