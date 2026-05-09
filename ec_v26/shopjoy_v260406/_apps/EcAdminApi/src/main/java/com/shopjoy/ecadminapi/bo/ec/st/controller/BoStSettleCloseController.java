package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleCloseService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 정산마감 API — /api/bo/ec/st/close
 */
@RestController
@RequestMapping("/api/bo/ec/st/close")
@RequiredArgsConstructor
public class BoStSettleCloseController {
    private final BoStSettleCloseService boStSettleCloseService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleCloseDto.Item>>> list(@Valid @ModelAttribute StSettleCloseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleCloseDto.PageResponse>> page(@Valid @ModelAttribute StSettleCloseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleCloseDto.Item>> getById(@PathVariable("id") String id) {
        StSettleCloseDto.Item result = boStSettleCloseService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleClose>> create(@RequestBody StSettleClose body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleCloseService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleClose>> update(@PathVariable("id") String id, @RequestBody StSettleClose body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleClose>> upsert(@PathVariable("id") String id, @RequestBody StSettleClose body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleCloseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** reopen */
    @PutMapping("/{id}/reopen")
    public ResponseEntity<ApiResponse<StSettleCloseDto>> reopen(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.reopen(id)));
    }
}
