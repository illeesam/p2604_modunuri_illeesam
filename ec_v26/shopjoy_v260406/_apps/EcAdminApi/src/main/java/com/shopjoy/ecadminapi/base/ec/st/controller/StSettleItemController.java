package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/st/settle-item")
@RequiredArgsConstructor
public class StSettleItemController {

    private final StSettleItemService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleItemDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<StSettleItemDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleItemDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<StSettleItemDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleItemDto>> getById(@PathVariable String id) {
        StSettleItemDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleItem>> create(@RequestBody StSettleItem entity) {
        StSettleItem result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleItem>> save(
            @PathVariable String id, @RequestBody StSettleItem entity) {
        entity.setSettleItemId(id);
        StSettleItem result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody StSettleItem entity) {
        entity.setSettleItemId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
