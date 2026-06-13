package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyhSendMsgLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bo/sy/send-msg-log")
@RequiredArgsConstructor
public class BoSyhSendMsgLogController {

    private final BoSyhSendMsgLogService boSyhSendMsgLogService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhSendMsgLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhSendMsgLogService.getById(id)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhSendMsgLogDto.PageResponse>> page(@Valid @ModelAttribute SyhSendMsgLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhSendMsgLogService.getPageData(req)));
    }
}
