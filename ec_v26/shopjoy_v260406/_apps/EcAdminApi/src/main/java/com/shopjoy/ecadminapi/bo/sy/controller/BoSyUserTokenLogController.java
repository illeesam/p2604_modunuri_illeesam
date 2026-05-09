package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserTokenLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 사용자 토큰 이력 API — /api/bo/sy/user-token-log
 */
@RestController
@RequestMapping("/api/bo/sy/user-token-log")
@RequiredArgsConstructor
public class BoSyUserTokenLogController {

    private final BoSyUserTokenLogService boSyUserTokenLogService;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserTokenLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserTokenLogService.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserTokenLogDto.Item>>> list(@Valid @ModelAttribute SyhUserTokenLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserTokenLogService.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhUserTokenLogDto.PageResponse>> page(@Valid @ModelAttribute SyhUserTokenLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserTokenLogService.getPageData(req)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyUserTokenLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
