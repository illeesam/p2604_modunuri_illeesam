package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhAlarmSendHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/alarm-send-hist")
@RequiredArgsConstructor
public class SyhAlarmSendHistController {

    private final SyhAlarmSendHistService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhAlarmSendHistDto.Item>> getById(@PathVariable("id") String id) {
        SyhAlarmSendHistDto.Item result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhAlarmSendHistDto.Item>>> list(@Valid @ModelAttribute SyhAlarmSendHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhAlarmSendHistDto.PageResponse>> page(@Valid @ModelAttribute SyhAlarmSendHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }
}
