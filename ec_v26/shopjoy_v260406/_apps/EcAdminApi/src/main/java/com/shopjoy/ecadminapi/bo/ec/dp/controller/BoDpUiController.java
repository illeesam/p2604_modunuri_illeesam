package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpUiService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 전시 UI API
 * GET    /api/bo/ec/dp/ui       — 목록
 * GET    /api/bo/ec/dp/ui/page  — 페이징
 * GET    /api/bo/ec/dp/ui/{id}  — 단건
 * POST   /api/bo/ec/dp/ui       — 등록
 * PUT    /api/bo/ec/dp/ui/{id}  — 수정
 * DELETE /api/bo/ec/dp/ui/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/ui")
@RequiredArgsConstructor
@UserOnly
public class BoDpUiController {
    private final BoDpUiService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpUiDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpUiDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpUi>> create(@RequestBody DpUi body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiDto>> update(@PathVariable String id, @RequestBody DpUi body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
