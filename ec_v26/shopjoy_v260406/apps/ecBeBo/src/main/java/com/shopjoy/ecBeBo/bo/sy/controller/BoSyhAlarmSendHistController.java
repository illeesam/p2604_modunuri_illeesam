package com.shopjoy.ecBeBo.bo.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecBeBo.bo.sy.service.BoSyhAlarmSendHistService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bo/sy/alarm-send-hist")
@RequiredArgsConstructor
public class BoSyhAlarmSendHistController {

    private final BoSyhAlarmSendHistService boSyhAlarmSendHistService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhAlarmSendHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhAlarmSendHistService.getById(id)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyhAlarmSendHistDto.Item>>> page(@Valid @ModelAttribute SyhAlarmSendHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyhAlarmSendHistService.getPageData(req)));
    }
}
