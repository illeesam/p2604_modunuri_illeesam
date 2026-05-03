package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmhPushLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/cm/push-log")
@RequiredArgsConstructor
public class CmhPushLogController {

    private final CmhPushLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmhPushLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<CmhPushLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmhPushLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<CmhPushLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmhPushLogDto>> getById(@PathVariable("id") String id) {
        CmhPushLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

}
