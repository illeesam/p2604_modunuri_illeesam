package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAccessLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * BO API 요청로그 API — /api/bo/sy/access-log
 */
@RestController
@RequestMapping("/api/bo/sy/access-log")
@RequiredArgsConstructor
public class BoSyAccessLogController {

    private final BoSyAccessLogService service;

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhAccessLogDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }
}
