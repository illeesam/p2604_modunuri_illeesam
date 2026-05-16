package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpAreaPanelService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/area-panel")
@RequiredArgsConstructor
public class DpAreaPanelController {

    private final DpAreaPanelService service;

    /* 전시 영역-패널 매핑 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaPanelDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 영역-패널 매핑 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpAreaPanelDto.Item>>> list(@Valid @ModelAttribute DpAreaPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 영역-패널 매핑 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpAreaPanelDto.PageResponse>> page(@Valid @ModelAttribute DpAreaPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 영역-패널 매핑 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpAreaPanel>> create(@RequestBody DpAreaPanel entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 영역-패널 매핑 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaPanel>> save(@PathVariable("id") String id, @RequestBody DpAreaPanel entity) {
        entity.setAreaPanelId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 전시 영역-패널 매핑 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaPanel>> updateSelective(@PathVariable("id") String id, @RequestBody DpAreaPanel entity) {
        entity.setAreaPanelId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 영역-패널 매핑 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 전시 영역-패널 매핑 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpAreaPanel> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
