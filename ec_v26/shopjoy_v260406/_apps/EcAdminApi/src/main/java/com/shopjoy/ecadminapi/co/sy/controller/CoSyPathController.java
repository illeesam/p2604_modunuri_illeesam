package com.shopjoy.ecadminapi.co.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.service.SyPathService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 표시경로 공용 API — /api/co/sy/path
 * 인가: FO·BO 모두 접근 가능 (읽기 전용)
 * PathTree(BoComp), PathPickModal, FO 카테고리 등 다중 화면 공유
 */
@RestController
@RequestMapping("/api/co/sy/path")
@RequiredArgsConstructor
public class CoSyPathController {

    private final SyPathService syPathService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPathDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPathDto.Item>>> list(@Valid @ModelAttribute SyPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyPathDto.PageResponse>> page(@Valid @ModelAttribute SyPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getPageData(req)));
    }
}
