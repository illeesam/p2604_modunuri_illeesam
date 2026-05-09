package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdOrderService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 주문 API
 * GET    /api/bo/ec/od/order       — 목록
 * GET    /api/bo/ec/od/order/page  — 페이징
 * GET    /api/bo/ec/od/order/{id}  — 단건
 * POST   /api/bo/ec/od/order       — 등록
 * PUT    /api/bo/ec/od/order/{id}  — 수정
 * DELETE /api/bo/ec/od/order/{id}  — 삭제
 * PATCH  /api/bo/ec/od/order/{id}/status — 상태변경
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/od/order")
@RequiredArgsConstructor
public class BoOdOrderController {
    private final BoOdOrderService boOdOrderService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDto.Item>>> list(@Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderDto.PageResponse>> page(@Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDto.Item>> getById(@PathVariable("id") String id) {
        OdOrderDto.Item result = boOdOrderService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrder>> create(@RequestBody OdOrder body) {
        OdOrder result = boOdOrderService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrder>> update(@PathVariable("id") String id, @RequestBody OdOrder body) {
        OdOrder result = boOdOrderService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrder>> upsert(@PathVariable("id") String id, @RequestBody OdOrder body) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boOdOrderService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OdOrderDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody OdOrderChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderService.changeStatus(id, req.getStatusCd())));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdOrder> rows) {
        boOdOrderService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}