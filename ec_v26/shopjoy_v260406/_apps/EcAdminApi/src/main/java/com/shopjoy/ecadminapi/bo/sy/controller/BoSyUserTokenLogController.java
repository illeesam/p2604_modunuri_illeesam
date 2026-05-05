package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserTokenLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 사용자 토큰 이력 API — /api/bo/sy/user-token-log
 */
@RestController
@RequestMapping("/api/bo/sy/user-token-log")
@RequiredArgsConstructor
public class BoSyUserTokenLogController {

    private final BoSyUserTokenLogService boSyUserTokenLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserTokenLogDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserTokenLogService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhUserTokenLogDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserTokenLogService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserTokenLogDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserTokenLogService.getById(id)));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyUserTokenLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
