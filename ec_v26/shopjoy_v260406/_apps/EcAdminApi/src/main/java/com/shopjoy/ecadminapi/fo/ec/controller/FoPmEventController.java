package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoPmEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    private final FoPmEventService foPmEventService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmEventDto.Item>>> list(@Valid @ModelAttribute PmEventDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foPmEventService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmEventDto.PageResponse>> page(@Valid @ModelAttribute PmEventDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foPmEventService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<PmEventDto.Item>> getById(@PathVariable("eventId") String eventId) {
        return ResponseEntity.ok(ApiResponse.ok(foPmEventService.getById(eventId)));
    }
}
