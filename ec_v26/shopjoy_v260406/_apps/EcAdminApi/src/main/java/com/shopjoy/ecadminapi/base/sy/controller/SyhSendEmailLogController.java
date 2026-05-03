package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhSendEmailLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/send-email-log")
@RequiredArgsConstructor
public class SyhSendEmailLogController {

    private final SyhSendEmailLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhSendEmailLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhSendEmailLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhSendEmailLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhSendEmailLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhSendEmailLogDto>> getById(@PathVariable("id") String id) {
        SyhSendEmailLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
