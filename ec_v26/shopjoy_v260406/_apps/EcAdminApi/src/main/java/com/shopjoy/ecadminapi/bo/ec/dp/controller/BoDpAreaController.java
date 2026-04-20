package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpAreaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 전시 영역 API
 * GET    /api/bo/ec/dp/area       — 목록
 * GET    /api/bo/ec/dp/area/page  — 페이징
 * GET    /api/bo/ec/dp/area/{id}  — 단건
 * POST   /api/bo/ec/dp/area       — 등록
 * PUT    /api/bo/ec/dp/area/{id}  — 수정
 * DELETE /api/bo/ec/dp/area/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/area")
@RequiredArgsConstructor
@UserOnly
public class BoDpAreaController {
    private final BoDpAreaService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpAreaDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpAreaDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpArea>> create(@RequestBody DpArea body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto>> update(@PathVariable String id, @RequestBody DpArea body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
