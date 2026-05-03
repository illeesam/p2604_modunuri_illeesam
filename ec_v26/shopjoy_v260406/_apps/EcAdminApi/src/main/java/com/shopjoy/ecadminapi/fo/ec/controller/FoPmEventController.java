package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 이벤트 API — 사용자 화면용 이벤트 목록 / 상세
 * GET /api/fo/ec/pm/event           — 이벤트 목록
 * GET /api/fo/ec/pm/event/page      — 이벤트 페이징
 * GET /api/fo/ec/pm/event/{eventId} — 이벤트 상세
 *
 * 인가: GET → USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/pm/event")
@RequiredArgsConstructor
public class FoPmEventController {

    private final FoPmEventService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmEventDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PmEventDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmEventDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PmEventDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<PmEventDto>> getById(@PathVariable("eventId") String eventId) {
        PmEventDto result = service.getById(eventId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
