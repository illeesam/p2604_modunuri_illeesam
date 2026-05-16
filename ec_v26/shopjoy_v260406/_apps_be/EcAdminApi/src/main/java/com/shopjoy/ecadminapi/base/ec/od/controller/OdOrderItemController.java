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

    /* 주문 아이템(상품) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 아이템(상품) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderItemDto.Item>>> list(@Valid @ModelAttribute OdOrderItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 아이템(상품) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderItemDto.PageResponse>> page(@Valid @ModelAttribute OdOrderItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 아이템(상품) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrderItem>> create(@RequestBody OdOrderItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 아이템(상품) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItem>> save(@PathVariable("id") String id, @RequestBody OdOrderItem entity) {
        entity.setOrderItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 주문 아이템(상품) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItem>> updateSelective(@PathVariable("id") String id, @RequestBody OdOrderItem entity) {
        entity.setOrderItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 아이템(상품) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 주문 아이템(상품) 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdOrderItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
