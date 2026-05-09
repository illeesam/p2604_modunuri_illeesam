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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpPanelDto.Item>>> list(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpPanelDto.PageResponse>> page(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpPanel>> create(@RequestBody DpPanel body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boDpPanelService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanel>> update(@PathVariable("id") String id, @RequestBody DpPanel body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanel>> upsert(@PathVariable("id") String id, @RequestBody DpPanel body) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boDpPanelService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<DpPanel>>> saveList(@RequestBody List<DpPanel> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boDpPanelService.saveList(rows), "저장되었습니다."));
    }
}
