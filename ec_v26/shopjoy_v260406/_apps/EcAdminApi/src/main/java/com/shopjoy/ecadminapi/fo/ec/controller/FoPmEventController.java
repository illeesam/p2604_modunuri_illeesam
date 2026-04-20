package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmEventService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String eventTypeCd,
            @RequestParam(required = false) String sort) {
        List<PmEventDto> result = service.getList(buildParam(siteId, kw, eventTypeCd, sort));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmEventDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String eventTypeCd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<PmEventDto> result = service.getPageData(buildParam(siteId, kw, eventTypeCd, sort), pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<PmEventDto>> getById(@PathVariable String eventId) {
        PmEventDto result = service.getById(eventId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildParam(String siteId, String kw, String eventTypeCd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId      != null) p.put("siteId",       siteId);
        if (kw          != null) p.put("kw",            kw);
        if (eventTypeCd != null) p.put("eventTypeCd",   eventTypeCd);
        if (sort        != null) p.put("sort",          sort);
        return p;
    }
}
