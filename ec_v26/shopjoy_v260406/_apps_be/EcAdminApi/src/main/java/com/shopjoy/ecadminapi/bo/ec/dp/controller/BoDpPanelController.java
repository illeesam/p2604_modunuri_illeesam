package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpPanelService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO DpPanel API — /api/bo/ec/dp/panel
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/panel")
@RequiredArgsConstructor
public class BoDpPanelController {

    private final BoDpPanelService boDpPanelService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpPanelDto.Item>>> list(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpPanelDto.PageResponse>> page(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpPanel>> create(@RequestBody DpPanel body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpPanelService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanel>> update(@PathVariable("id") String id, @RequestBody DpPanel body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanel>> upsert(@PathVariable("id") String id, @RequestBody DpPanel body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpPanelService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<DpPanel> rows) {
        boDpPanelService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
    /** pathCounts — 표시경로 노드별 DpPanel 수 (자손 누적, 트리 우측 뱃지용) */
    @GetMapping("/path-counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> pathCounts(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getPathTreeNodeCounts(req)));
    }

}
