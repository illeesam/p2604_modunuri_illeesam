package com.shopjoy.ecBeBo.bo.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecBeBo.bo.sy.service.BoSyhSendMsgLogService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<BasePage<SyhSendMsgLogDto.Item>>> page(@Valid @ModelAttribute SyhSendMsgLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhSendMsgLogService.getPageData(req)));
    }
}
