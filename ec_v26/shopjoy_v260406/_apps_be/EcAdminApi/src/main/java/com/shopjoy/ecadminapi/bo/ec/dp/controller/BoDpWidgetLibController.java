package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetLibService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO DpWidgetLib API — /api/bo/ec/dp/widget-lib
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/widget-lib")
@RequiredArgsConstructor
public class BoDpWidgetLibController {

    private final BoDpWidgetLibService boDpWidgetLibService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLibDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetLibService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpWidgetLibDto.Item>>> list(@Valid @ModelAttribute DpWidgetLibDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetLibService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpWidgetLibDto.PageResponse>> page(@Valid @ModelAttribute DpWidgetLibDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetLibService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpWidgetLib>> create(@RequestBody DpWidgetLib body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpWidgetLibService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLib>> update(@PathVariable("id") String id, @RequestBody DpWidgetLib body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetLibService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLib>> upsert(@PathVariable("id") String id, @RequestBody DpWidgetLib body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetLibService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpWidgetLibService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpWidgetLib> rows) {
        boDpWidgetLibService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
