package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAccessLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO API 요청로그 API — /api/bo/sy/access-log
 */
@RestController
@RequestMapping("/api/bo/sy/access-log")
@RequiredArgsConstructor
public class BoSyAccessLogController {

    private final BoSyAccessLogService boSyAccessLogService;

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhAccessLogDto.PageResponse>> page(@Valid @ModelAttribute SyhAccessLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAccessLogService.getPageData(req)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyAccessLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
