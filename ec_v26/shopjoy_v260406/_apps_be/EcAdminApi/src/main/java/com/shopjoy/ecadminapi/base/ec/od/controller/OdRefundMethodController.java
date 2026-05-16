package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.service.OdRefundMethodService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/refund-method")
@RequiredArgsConstructor
public class OdRefundMethodController {

    private final OdRefundMethodService service;

    /* 환불수단 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefundMethodDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 환불수단 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdRefundMethodDto.Item>>> list(@Valid @ModelAttribute OdRefundMethodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 환불수단 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdRefundMethodDto.PageResponse>> page(@Valid @ModelAttribute OdRefundMethodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 환불수단 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdRefundMethod>> create(@RequestBody OdRefundMethod entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 환불수단 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefundMethod>> save(@PathVariable("id") String id, @RequestBody OdRefundMethod entity) {
        entity.setRefundMethodId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 환불수단 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefundMethod>> updateSelective(@PathVariable("id") String id, @RequestBody OdRefundMethod entity) {
        entity.setRefundMethodId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 환불수단 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 환불수단 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdRefundMethod> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
