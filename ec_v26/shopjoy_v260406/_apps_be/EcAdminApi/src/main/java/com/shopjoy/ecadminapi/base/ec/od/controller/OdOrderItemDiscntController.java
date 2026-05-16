package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderItemDiscntService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-item-discnt")
@RequiredArgsConstructor
public class OdOrderItemDiscntController {

    private final OdOrderItemDiscntService service;

    /* 주문 아이템 할인 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItemDiscntDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 아이템 할인 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderItemDiscntDto.Item>>> list(@Valid @ModelAttribute OdOrderItemDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 아이템 할인 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderItemDiscntDto.PageResponse>> page(@Valid @ModelAttribute OdOrderItemDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 아이템 할인 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrderItemDiscnt>> create(@RequestBody OdOrderItemDiscnt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 아이템 할인 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItemDiscnt>> save(@PathVariable("id") String id, @RequestBody OdOrderItemDiscnt entity) {
        entity.setItemDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 주문 아이템 할인 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItemDiscnt>> updateSelective(@PathVariable("id") String id, @RequestBody OdOrderItemDiscnt entity) {
        entity.setItemDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 아이템 할인 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 주문 아이템 할인 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdOrderItemDiscnt> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
