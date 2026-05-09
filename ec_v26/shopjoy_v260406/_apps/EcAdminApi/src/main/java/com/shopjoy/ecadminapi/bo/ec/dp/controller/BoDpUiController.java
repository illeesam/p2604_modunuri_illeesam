package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpUiService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO DpUi API — /api/bo/ec/dp/ui
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/ui")
@RequiredArgsConstructor
public class BoDpUiController {

    private final BoDpUiService boDpUiService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpUiService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpUiDto.Item>>> list(@Valid @ModelAttribute DpUiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpUiService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpUiDto.PageResponse>> page(@Valid @ModelAttribute DpUiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpUiService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpUi>> create(@RequestBody DpUi body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpUiService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUi>> update(@PathVariable("id") String id, @RequestBody DpUi body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpUiService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUi>> upsert(@PathVariable("id") String id, @RequestBody DpUi body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpUiService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpUiService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<DpUi>>> saveList(@RequestBody List<DpUi> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boDpUiService.saveList(rows), "저장되었습니다."));
    }
}
