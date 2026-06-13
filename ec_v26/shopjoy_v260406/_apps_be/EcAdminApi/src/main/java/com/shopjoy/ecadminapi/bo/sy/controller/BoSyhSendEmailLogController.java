package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyhSendEmailLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bo/sy/send-email-log")
@RequiredArgsConstructor
public class BoSyhSendEmailLogController {

    private final BoSyhSendEmailLogService boSyhSendEmailLogService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhSendEmailLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhSendEmailLogService.getById(id)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhSendEmailLogDto.PageResponse>> page(@Valid @ModelAttribute SyhSendEmailLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhSendEmailLogService.getPageData(req)));
    }
}
