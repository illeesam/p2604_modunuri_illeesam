package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdOrderService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 주문 API
 * GET    /api/bo/ec/ord/order       — 목록
 * GET    /api/bo/ec/ord/order/page  — 페이징
 * GET    /api/bo/ec/ord/order/{id}  — 단건
 * POST   /api/bo/ec/ord/order       — 등록
 * PUT    /api/bo/ec/ord/order/{id}  — 수정
 * DELETE /api/bo/ec/ord/order/{id}  — 삭제
 * PATCH  /api/bo/ec/ord/order/{id}/status — 상태변경
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/ord/order")
@RequiredArgsConstructor
@UserOnly
public class BoOdOrderController {
    private final BoOdOrderService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<OdOrderDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdOrderDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<OdOrderDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdOrder>> create(@RequestBody OdOrder body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDto>> update(@PathVariable String id, @RequestBody OdOrder body) {
        OdOrderDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OdOrderDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        OdOrderDto result = service.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
