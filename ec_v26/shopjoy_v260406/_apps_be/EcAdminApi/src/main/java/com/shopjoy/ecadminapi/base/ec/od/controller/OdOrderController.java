package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order")
@RequiredArgsConstructor
public class OdOrderController {

    private final OdOrderService service;

    /* 주문 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDto.Item>>> list(@Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderDto.PageResponse>> page(@Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrder>> create(@RequestBody OdOrder entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrder>> save(@PathVariable("id") String id, @RequestBody OdOrder entity) {
        entity.setOrderId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 주문 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrder>> updateSelective(@PathVariable("id") String id, @RequestBody OdOrder entity) {
        entity.setOrderId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 주문 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdOrder> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
