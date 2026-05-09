package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBatchLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 배치 이력 API — /api/bo/sy/batch-log
 */
@RestController
@RequestMapping("/api/bo/sy/batch-log")
@RequiredArgsConstructor
public class BoSyBatchLogController {

    private final BoSyBatchLogService boSyBatchLogService;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhBatchLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchLogService.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhBatchLogDto.Item>>> list(@Valid @ModelAttribute SyhBatchLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchLogService.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhBatchLogDto.PageResponse>> page(@Valid @ModelAttribute SyhBatchLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBatchLogService.getPageData(req)));
    }
}
