package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpAreaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO DpArea API — /api/bo/ec/dp/area
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/area")
@RequiredArgsConstructor
public class BoDpAreaController {

    private final BoDpAreaService boDpAreaService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpAreaDto.Item>>> list(@Valid @ModelAttribute DpAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpAreaDto.PageResponse>> page(@Valid @ModelAttribute DpAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpArea>> create(@RequestBody DpArea body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpAreaService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpArea>> update(@PathVariable("id") String id, @RequestBody DpArea body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpArea>> upsert(@PathVariable("id") String id, @RequestBody DpArea body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpAreaService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<DpArea>>> saveList(@RequestBody List<DpArea> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.saveList(rows), "저장되었습니다."));
    }
}
