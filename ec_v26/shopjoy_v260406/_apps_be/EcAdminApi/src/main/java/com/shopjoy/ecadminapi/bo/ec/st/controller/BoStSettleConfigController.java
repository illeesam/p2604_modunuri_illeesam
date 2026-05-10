package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleConfigService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 정산설정 API — /api/bo/ec/st/config
 */
@RestController
@RequestMapping("/api/bo/ec/st/config")
@RequiredArgsConstructor
public class BoStSettleConfigController {
    private final BoStSettleConfigService boStSettleConfigService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleConfigDto.Item>>> list(@Valid @ModelAttribute StSettleConfigDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleConfigDto.PageResponse>> page(@Valid @ModelAttribute StSettleConfigDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfigDto.Item>> getById(@PathVariable("id") String id) {
        StSettleConfigDto.Item result = boStSettleConfigService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleConfig>> create(@RequestBody StSettleConfig body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleConfigService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfig>> update(@PathVariable("id") String id, @RequestBody StSettleConfig body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfig>> upsert(@PathVariable("id") String id, @RequestBody StSettleConfig body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleConfigService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
