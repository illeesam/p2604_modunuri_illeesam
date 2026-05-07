package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberLoginLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 회원 로그인 이력 API — /api/bo/ec/mb/member-login-log
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-login-log")
@RequiredArgsConstructor
public class BoMbMemberLoginLogController {

    private final BoMbMemberLoginLogService boMbMemberLoginLogService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberLoginLogDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberLoginLogService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbhMemberLoginLogDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberLoginLogService.getPageData(p)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberLoginLogDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberLoginLogService.getById(id)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boMbMemberLoginLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
