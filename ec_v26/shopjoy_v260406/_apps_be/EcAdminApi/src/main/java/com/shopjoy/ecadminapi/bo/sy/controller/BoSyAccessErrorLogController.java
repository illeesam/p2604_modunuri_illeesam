package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAccessErrorLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO API 오류로그 API — /api/bo/sy/access-error-log
 */
@RestController
@RequestMapping("/api/bo/sy/access-error-log")
@RequiredArgsConstructor
public class BoSyAccessErrorLogController {

    private final BoSyAccessErrorLogService boSyAccessErrorLogService;

    /** getById — 단건 상세조회 (코드명/연관명 풀필드) */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhAccessErrorLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAccessErrorLogService.getById(id)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhAccessErrorLogDto.PageResponse>> page(@Valid @ModelAttribute SyhAccessErrorLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAccessErrorLogService.getPageData(req)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyAccessErrorLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
