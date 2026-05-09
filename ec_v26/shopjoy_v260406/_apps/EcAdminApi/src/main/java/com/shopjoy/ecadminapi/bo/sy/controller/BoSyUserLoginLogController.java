package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserLoginLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 사용자 로그인 이력 API — /api/bo/sy/user-login-log
 */
@RestController
@RequestMapping("/api/bo/sy/user-login-log")
@RequiredArgsConstructor
public class BoSyUserLoginLogController {

    private final BoSyUserLoginLogService boSyUserLoginLogService;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserLoginLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserLoginLogService.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserLoginLogDto.Item>>> list(@Valid @ModelAttribute SyhUserLoginLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserLoginLogService.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhUserLoginLogDto.PageResponse>> page(@Valid @ModelAttribute SyhUserLoginLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserLoginLogService.getPageData(req)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyUserLoginLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
