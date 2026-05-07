package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleRawService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산원장 조회 API — /api/bo/ec/st/raw
 */
@RestController
@RequestMapping("/api/bo/ec/st/raw")
@RequiredArgsConstructor
public class BoStSettleRawController {
    private final BoStSettleRawService boStSettleRawService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleRawDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleRawService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleRawDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleRawService.getPageData(p)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleRawDto>> getById(@PathVariable("id") String id) {
        StSettleRawDto result = boStSettleRawService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleRaw>> create(@RequestBody StSettleRaw body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleRawService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleRawDto>> update(@PathVariable("id") String id, @RequestBody StSettleRaw body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleRawService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleRawDto>> upsert(@PathVariable("id") String id, @RequestBody StSettleRaw body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleRawService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleRawService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
