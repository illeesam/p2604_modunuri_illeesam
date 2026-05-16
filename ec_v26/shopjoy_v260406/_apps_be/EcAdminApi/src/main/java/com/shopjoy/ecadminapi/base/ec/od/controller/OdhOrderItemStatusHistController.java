package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderItemStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-item-status-hist")
@RequiredArgsConstructor
public class OdhOrderItemStatusHistController {

    private final OdhOrderItemStatusHistService service;

    /* 주문 아이템 상태 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 아이템 상태 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderItemStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhOrderItemStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 아이템 상태 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhOrderItemStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhOrderItemStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 아이템 상태 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhOrderItemStatusHist>> create(@RequestBody OdhOrderItemStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 아이템 상태 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhOrderItemStatusHist entity) {
        entity.setOrderItemStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 주문 아이템 상태 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemStatusHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhOrderItemStatusHist entity) {
        entity.setOrderItemStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 아이템 상태 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 주문 아이템 상태 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhOrderItemStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
