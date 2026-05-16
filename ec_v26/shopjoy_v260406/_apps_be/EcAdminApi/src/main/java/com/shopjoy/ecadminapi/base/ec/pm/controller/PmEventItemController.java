package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/event-item")
@RequiredArgsConstructor
public class PmEventItemController {

    private final PmEventItemService service;

    /* 이벤트 대상 상품 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 이벤트 대상 상품 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmEventItemDto.Item>>> list(@Valid @ModelAttribute PmEventItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 이벤트 대상 상품 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmEventItemDto.PageResponse>> page(@Valid @ModelAttribute PmEventItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 이벤트 대상 상품 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmEventItem>> create(@RequestBody PmEventItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 이벤트 대상 상품 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventItem>> save(@PathVariable("id") String id, @RequestBody PmEventItem entity) {
        entity.setEventItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 이벤트 대상 상품 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventItem>> updateSelective(@PathVariable("id") String id, @RequestBody PmEventItem entity) {
        entity.setEventItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 이벤트 대상 상품 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 이벤트 대상 상품 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmEventItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
