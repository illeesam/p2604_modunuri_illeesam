package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettlePayService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 정산지급 API — /api/bo/ec/st/pay
 */
@RestController
@RequestMapping("/api/bo/ec/st/pay")
@RequiredArgsConstructor
public class BoStSettlePayController {
    private final BoStSettlePayService boStSettlePayService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettlePayDto.Item>>> list(@Valid @ModelAttribute StSettlePayDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettlePayService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettlePayDto.PageResponse>> page(@Valid @ModelAttribute StSettlePayDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettlePayService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettlePayDto.Item>> getById(@PathVariable("id") String id) {
        StSettlePayDto.Item result = boStSettlePayService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettlePay>> create(@RequestBody StSettlePay body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettlePayService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettlePay>> update(@PathVariable("id") String id, @RequestBody StSettlePay body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettlePayService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettlePay>> upsert(@PathVariable("id") String id, @RequestBody StSettlePay body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettlePayService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettlePayService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** pay — 결제 */
    @PutMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<StSettlePayDto>> pay(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettlePayService.pay(id)));
    }
}
