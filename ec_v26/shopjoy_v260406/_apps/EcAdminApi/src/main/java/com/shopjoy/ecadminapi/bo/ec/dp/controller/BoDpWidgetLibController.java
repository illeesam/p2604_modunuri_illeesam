package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetLibService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 전시 위젯 라이브러리 API
 * GET    /api/bo/ec/dp/widget-lib       — 목록
 * GET    /api/bo/ec/dp/widget-lib/page  — 페이징
 * GET    /api/bo/ec/dp/widget-lib/{id}  — 단건
 * POST   /api/bo/ec/dp/widget-lib       — 등록
 * PUT    /api/bo/ec/dp/widget-lib/{id}  — 수정
 * DELETE /api/bo/ec/dp/widget-lib/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/widget-lib")
@RequiredArgsConstructor
public class BoDpWidgetLibController {
    private final BoDpWidgetLibService boDpWidgetLibService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpWidgetLibDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<DpWidgetLibDto> result = boDpWidgetLibService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpWidgetLibDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<DpWidgetLibDto> result = boDpWidgetLibService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLibDto>> getById(@PathVariable("id") String id) {
        DpWidgetLibDto result = boDpWidgetLibService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpWidgetLib>> create(@RequestBody DpWidgetLib body) {
        DpWidgetLib result = boDpWidgetLibService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLibDto>> update(@PathVariable("id") String id, @RequestBody DpWidgetLib body) {
        DpWidgetLibDto result = boDpWidgetLibService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLibDto>> upsert(@PathVariable("id") String id, @RequestBody DpWidgetLib body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpWidgetLibService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpWidgetLibService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpWidgetLib> rows) {
        boDpWidgetLibService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
