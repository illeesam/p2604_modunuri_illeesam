package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpAreaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 전시 영역 API
 * GET    /api/bo/ec/dp/area       — 목록
 * GET    /api/bo/ec/dp/area/page  — 페이징
 * GET    /api/bo/ec/dp/area/{id}  — 단건
 * POST   /api/bo/ec/dp/area       — 등록
 * PUT    /api/bo/ec/dp/area/{id}  — 수정
 * DELETE /api/bo/ec/dp/area/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/area")
@RequiredArgsConstructor
public class BoDpAreaController {
    private final BoDpAreaService boDpAreaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpAreaDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<DpAreaDto> result = boDpAreaService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpAreaDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<DpAreaDto> result = boDpAreaService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto>> getById(@PathVariable("id") String id) {
        DpAreaDto result = boDpAreaService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpArea>> create(@RequestBody DpArea body) {
        DpArea result = boDpAreaService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto>> update(@PathVariable("id") String id, @RequestBody DpArea body) {
        DpAreaDto result = boDpAreaService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto>> upsert(@PathVariable("id") String id, @RequestBody DpArea body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpAreaService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpAreaService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpArea> rows) {
        boDpAreaService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
