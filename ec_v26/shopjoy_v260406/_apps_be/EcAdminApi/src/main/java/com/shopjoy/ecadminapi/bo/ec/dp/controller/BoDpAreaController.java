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

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpAreaDto.Item>>> list(@Valid @ModelAttribute DpAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpAreaDto.PageResponse>> page(@Valid @ModelAttribute DpAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpArea>> create(@RequestBody DpArea body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpAreaService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpArea>> update(@PathVariable("id") String id, @RequestBody DpArea body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpArea>> upsert(@PathVariable("id") String id, @RequestBody DpArea body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpAreaService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpArea> rows) {
        boDpAreaService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
