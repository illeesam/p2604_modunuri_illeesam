package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 전시 위젯 API
 * GET    /api/bo/ec/dp/widget       — 목록
 * GET    /api/bo/ec/dp/widget/page  — 페이징
 * GET    /api/bo/ec/dp/widget/{id}  — 단건
 * POST   /api/bo/ec/dp/widget       — 등록
 * PUT    /api/bo/ec/dp/widget/{id}  — 수정
 * DELETE /api/bo/ec/dp/widget/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/widget")
@RequiredArgsConstructor
public class BoDpWidgetController {
    private final BoDpWidgetService boDpWidgetService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpWidgetDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<DpWidgetDto> result = boDpWidgetService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpWidgetDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<DpWidgetDto> result = boDpWidgetService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetDto>> getById(@PathVariable("id") String id) {
        DpWidgetDto result = boDpWidgetService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpWidget>> create(@RequestBody DpWidget body) {
        DpWidget result = boDpWidgetService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetDto>> update(@PathVariable("id") String id, @RequestBody DpWidget body) {
        DpWidgetDto result = boDpWidgetService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetDto>> upsert(@PathVariable("id") String id, @RequestBody DpWidget body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpWidgetService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpWidget> rows) {
        boDpWidgetService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}