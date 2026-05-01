package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbhMemberTokenLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/mb/member-token-log")
@RequiredArgsConstructor
public class MbhMemberTokenLogController {

    private final MbhMemberTokenLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberTokenLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<MbhMemberTokenLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbhMemberTokenLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<MbhMemberTokenLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberTokenLogDto>> getById(@PathVariable String id) {
        MbhMemberTokenLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
