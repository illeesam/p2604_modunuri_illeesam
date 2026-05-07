package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAccessErrorLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * BO API 오류로그 API — /api/bo/sy/access-error-log
 */
@RestController
@RequestMapping("/api/bo/sy/access-error-log")
@RequiredArgsConstructor
public class BoSyAccessErrorLogController {

    private final BoSyAccessErrorLogService boSyAccessErrorLogService;

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhAccessErrorLogDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAccessErrorLogService.getPageData(p)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyAccessErrorLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
