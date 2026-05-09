package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-item")
@RequiredArgsConstructor
public class StSettleItemController {

    private final StSettleItemService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleItemDto.Item>>> list(@Valid @ModelAttribute StSettleItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleItemDto.PageResponse>> page(@Valid @ModelAttribute StSettleItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StSettleItem>> create(@RequestBody StSettleItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleItem>> save(@PathVariable("id") String id, @RequestBody StSettleItem entity) {
        entity.setSettleItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleItem>> updatePartial(@PathVariable("id") String id, @RequestBody StSettleItem entity) {
        entity.setSettleItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StSettleItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
