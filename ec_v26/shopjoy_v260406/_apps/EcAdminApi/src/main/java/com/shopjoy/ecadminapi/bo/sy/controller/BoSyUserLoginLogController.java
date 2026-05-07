package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserLoginLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 사용자 로그인 이력 API — /api/bo/sy/user-login-log
 */
@RestController
@RequestMapping("/api/bo/sy/user-login-log")
@RequiredArgsConstructor
public class BoSyUserLoginLogController {

    private final BoSyUserLoginLogService boSyUserLoginLogService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserLoginLogDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserLoginLogService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhUserLoginLogDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserLoginLogService.getPageData(p)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserLoginLogDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserLoginLogService.getById(id)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyUserLoginLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
