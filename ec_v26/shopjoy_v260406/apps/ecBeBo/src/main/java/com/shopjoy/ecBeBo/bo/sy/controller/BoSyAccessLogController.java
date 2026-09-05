package com.shopjoy.ecBeBo.bo.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecBeBo.bo.sy.service.BoSyAccessLogService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO API 요청로그 API — /api/bo/sy/access-log
 */
@RestController
@RequestMapping("/api/bo/sy/access-log")
@RequiredArgsConstructor
public class BoSyAccessLogController {

    private final BoSyAccessLogService boSyAccessLogService;

    /** getById — 단건 상세조회 (코드명/연관명 풀필드) */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhAccessLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAccessLogService.getById(id)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyhAccessLogDto.Item>>> page(@Valid @ModelAttribute SyhAccessLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAccessLogService.getPageData(req)));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        boSyAccessLogService.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
