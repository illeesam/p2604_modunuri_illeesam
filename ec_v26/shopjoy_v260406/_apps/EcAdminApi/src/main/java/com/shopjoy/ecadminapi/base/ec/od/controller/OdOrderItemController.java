package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-item")
@RequiredArgsConstructor
public class OdOrderItemController {

    private final OdOrderItemService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderItemDto.Item>>> list(@Valid @ModelAttribute OdOrderItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderItemDto.PageResponse>> page(@Valid @ModelAttribute OdOrderItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdOrderItem>> create(@RequestBody OdOrderItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItem>> save(@PathVariable("id") String id, @RequestBody OdOrderItem entity) {
        entity.setOrderItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItem>> updatePartial(@PathVariable("id") String id, @RequestBody OdOrderItem entity) {
        entity.setOrderItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdOrderItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
