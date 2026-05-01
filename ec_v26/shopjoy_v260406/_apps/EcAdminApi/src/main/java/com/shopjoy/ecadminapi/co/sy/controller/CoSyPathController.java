package com.shopjoy.ecadminapi.co.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.service.SyPathService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 표시경로 공용 API — /api/co/sy/path
 * 인가: FO·BO 모두 접근 가능 (읽기 전용)
 * PathTree(BoComp), PathPickModal, FO 카테고리 등 다중 화면 공유
 */
@RestController
@RequestMapping("/api/co/sy/path")
@RequiredArgsConstructor
public class CoSyPathController {

    private final SyPathService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPathDto>>> list(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyPathDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPathDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }
}
