package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhAlarmSendHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/alarm-send-hist")
@RequiredArgsConstructor
public class SyhAlarmSendHistController {

    private final SyhAlarmSendHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhAlarmSendHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhAlarmSendHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhAlarmSendHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhAlarmSendHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhAlarmSendHistDto>> getById(@PathVariable("id") String id) {
        SyhAlarmSendHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
