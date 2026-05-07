package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpPanelService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 전시 패널 API
 * GET    /api/bo/ec/dp/panel       — 목록
 * GET    /api/bo/ec/dp/panel/page  — 페이징
 * GET    /api/bo/ec/dp/panel/{id}  — 단건
 * POST   /api/bo/ec/dp/panel       — 등록
 * PUT    /api/bo/ec/dp/panel/{id}  — 수정
 * DELETE /api/bo/ec/dp/panel/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/panel")
@RequiredArgsConstructor
public class BoDpPanelController {
    private final BoDpPanelService boDpPanelService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpPanelDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<DpPanelDto> result = boDpPanelService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpPanelDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<DpPanelDto> result = boDpPanelService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelDto>> getById(@PathVariable("id") String id) {
        DpPanelDto result = boDpPanelService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpPanel>> create(@RequestBody DpPanel body) {
        DpPanel result = boDpPanelService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelDto>> update(@PathVariable("id") String id, @RequestBody DpPanel body) {
        DpPanelDto result = boDpPanelService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelDto>> upsert(@PathVariable("id") String id, @RequestBody DpPanel body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpPanelService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpPanel> rows) {
        boDpPanelService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
