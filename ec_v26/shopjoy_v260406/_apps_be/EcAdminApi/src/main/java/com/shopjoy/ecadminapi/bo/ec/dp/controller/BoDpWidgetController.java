package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO DpWidget API — /api/bo/ec/dp/widget
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/widget")
@RequiredArgsConstructor
public class BoDpWidgetController {

    private final BoDpWidgetService boDpWidgetService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpWidgetDto.Item>>> list(@Valid @ModelAttribute DpWidgetDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpWidgetDto.PageResponse>> page(@Valid @ModelAttribute DpWidgetDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpWidget>> create(@RequestBody DpWidget body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpWidgetService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidget>> update(@PathVariable("id") String id, @RequestBody DpWidget body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidget>> upsert(@PathVariable("id") String id, @RequestBody DpWidget body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpWidgetService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpWidget> rows) {
        boDpWidgetService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
