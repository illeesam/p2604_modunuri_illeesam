package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhSendMsgLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/send-msg-log")
@RequiredArgsConstructor
public class SyhSendMsgLogController {

    private final SyhSendMsgLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhSendMsgLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhSendMsgLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhSendMsgLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhSendMsgLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhSendMsgLogDto>> getById(@PathVariable String id) {
        SyhSendMsgLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
