package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberTokenLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 회원 토큰 이력 API — /api/bo/ec/mb/member-token-log
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-token-log")
@RequiredArgsConstructor
public class BoMbMemberTokenLogController {

    private final BoMbMemberTokenLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberTokenLogDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbhMemberTokenLogDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberTokenLogDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        service.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
