package com.shopjoy.ecadminapi.co.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSySiteService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사이트 공용 API — /api/co/sy/site
 * 인가: FO·BO 모두 접근 가능 (읽기 전용)
 */
@RestController
@RequestMapping("/api/co/sy/site")
@RequiredArgsConstructor
public class CoSySiteController {

    private final BoSySiteService boSySiteService;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SySiteDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SySiteDto.Item>>> list(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SySiteDto.PageResponse>> page(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getPageData(req)));
    }
}
