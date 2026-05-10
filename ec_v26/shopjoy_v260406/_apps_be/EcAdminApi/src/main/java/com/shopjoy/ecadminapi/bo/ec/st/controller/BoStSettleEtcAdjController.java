package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleEtcAdjService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 기타정산조정 API — /api/bo/ec/st/etc-adj
 */
@RestController
@RequestMapping("/api/bo/ec/st/etc-adj")
@RequiredArgsConstructor
public class BoStSettleEtcAdjController {
    private final BoStSettleEtcAdjService boStSettleEtcAdjService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleEtcAdjDto.Item>>> list(@Valid @ModelAttribute StSettleEtcAdjDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleEtcAdjService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleEtcAdjDto.PageResponse>> page(@Valid @ModelAttribute StSettleEtcAdjDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleEtcAdjService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdjDto.Item>> getById(@PathVariable("id") String id) {
        StSettleEtcAdjDto.Item result = boStSettleEtcAdjService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> create(@RequestBody StSettleEtcAdj body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleEtcAdjService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> update(@PathVariable("id") String id, @RequestBody StSettleEtcAdj body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleEtcAdjService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> upsert(@PathVariable("id") String id, @RequestBody StSettleEtcAdj body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleEtcAdjService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleEtcAdjService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
