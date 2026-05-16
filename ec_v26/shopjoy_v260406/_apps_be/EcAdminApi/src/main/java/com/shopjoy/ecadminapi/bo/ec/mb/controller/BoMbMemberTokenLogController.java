package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberTokenLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 회원 토큰 이력 API — /api/bo/ec/mb/member-token-log
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-token-log")
@RequiredArgsConstructor
public class BoMbMemberTokenLogController {

    private final BoMbMemberTokenLogService boMbMemberTokenLogService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberTokenLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberTokenLogService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberTokenLogDto.Item>>> list(@Valid @ModelAttribute MbhMemberTokenLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberTokenLogService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbhMemberTokenLogDto.PageResponse>> page(@Valid @ModelAttribute MbhMemberTokenLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberTokenLogService.getPageData(req)));
    }

    /* deleteAll */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boMbMemberTokenLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
