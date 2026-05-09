package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleAdjService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산조정 API — /api/bo/ec/st/adj
 */
@RestController
@RequestMapping("/api/bo/ec/st/adj")
@RequiredArgsConstructor
public class BoStSettleAdjController {
    private final BoStSettleAdjService boStSettleAdjService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleAdjDto.Item>>> list(@Valid @ModelAttribute StSettleAdjDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleAdjService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleAdjDto.PageResponse>> page(@Valid @ModelAttribute StSettleAdjDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleAdjService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleAdjDto.Item>> getById(@PathVariable("id") String id) {
        StSettleAdjDto.Item result = boStSettleAdjService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleAdj>> create(@RequestBody StSettleAdj body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleAdjService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleAdj>> update(@PathVariable("id") String id, @RequestBody StSettleAdj body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleAdjService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleAdj>> upsert(@PathVariable("id") String id, @RequestBody StSettleAdj body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleAdjService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleAdjService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** approve — 승인 */
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<StSettleAdjDto>> approve(
            @PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleAdjService.approve(id, body)));
    }
}
