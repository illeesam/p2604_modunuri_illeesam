package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpPanelItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/panel-item")
@RequiredArgsConstructor
public class DpPanelItemController {

    private final DpPanelItemService service;

    /* 전시 패널 아이템 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 패널 아이템 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpPanelItemDto.Item>>> list(@Valid @ModelAttribute DpPanelItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 패널 아이템 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpPanelItemDto.PageResponse>> page(@Valid @ModelAttribute DpPanelItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 패널 아이템 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpPanelItem>> create(@RequestBody DpPanelItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 패널 아이템 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelItem>> save(@PathVariable("id") String id, @RequestBody DpPanelItem entity) {
        entity.setPanelItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 전시 패널 아이템 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelItem>> updateSelective(@PathVariable("id") String id, @RequestBody DpPanelItem entity) {
        entity.setPanelItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 패널 아이템 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 전시 패널 아이템 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpPanelItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
