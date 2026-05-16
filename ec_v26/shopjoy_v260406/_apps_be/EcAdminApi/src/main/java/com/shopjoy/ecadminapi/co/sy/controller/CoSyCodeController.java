package com.shopjoy.ecadminapi.co.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공통코드 공용 API — /api/co/sy/code
 * 인가: FO·BO 모두 접근 가능 (읽기 전용)
 */
@RestController
@RequestMapping("/api/co/sy/code")
@RequiredArgsConstructor
public class CoSyCodeController {

    private final SyCodeService syCodeService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> list(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeDto.PageResponse>> page(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getPageData(req)));
    }
}
