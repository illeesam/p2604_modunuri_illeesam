package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhApiLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/api-log")
@RequiredArgsConstructor
public class SyhApiLogController {

    private final SyhApiLogService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhApiLogDto.Item>> getById(@PathVariable("id") String id) {
        SyhApiLogDto.Item result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhApiLogDto.Item>>> list(
            @Valid @ModelAttribute SyhApiLogDto.Request req) {
        List<SyhApiLogDto.Item> result = service.getList(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyhApiLogDto.PageResponse>> page(
            @Valid @ModelAttribute SyhApiLogDto.Request req) {
        SyhApiLogDto.PageResponse result = service.getPageData(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
