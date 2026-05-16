package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberLoginLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 회원 로그인 이력 API — /api/bo/ec/mb/member-login-log
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-login-log")
@RequiredArgsConstructor
public class BoMbMemberLoginLogController {

    private final BoMbMemberLoginLogService boMbMemberLoginLogService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberLoginLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberLoginLogService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberLoginLogDto.Item>>> list(@Valid @ModelAttribute MbhMemberLoginLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberLoginLogService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbhMemberLoginLogDto.PageResponse>> page(@Valid @ModelAttribute MbhMemberLoginLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberLoginLogService.getPageData(req)));
    }

    /* deleteAll */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boMbMemberLoginLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
