package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-status-hist")
@RequiredArgsConstructor
public class OdhOrderStatusHistController {

    private final OdhOrderStatusHistService service;

    /* 주문 상태 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 상태 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhOrderStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 상태 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhOrderStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhOrderStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 상태 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhOrderStatusHist>> create(@RequestBody OdhOrderStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 상태 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhOrderStatusHist entity) {
        entity.setOrderStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 주문 상태 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderStatusHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhOrderStatusHist entity) {
        entity.setOrderStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 상태 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 주문 상태 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhOrderStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
