package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderDiscntService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-discnt")
@RequiredArgsConstructor
public class OdOrderDiscntController {

    private final OdOrderDiscntService service;

    /* 주문 할인 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDiscntDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 할인 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDiscntDto.Item>>> list(@Valid @ModelAttribute OdOrderDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 할인 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderDiscntDto.PageResponse>> page(@Valid @ModelAttribute OdOrderDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 할인 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> create(@RequestBody OdOrderDiscnt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 할인 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> save(@PathVariable("id") String id, @RequestBody OdOrderDiscnt entity) {
        entity.setOrderDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 주문 할인 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> updateSelective(@PathVariable("id") String id, @RequestBody OdOrderDiscnt entity) {
        entity.setOrderDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 할인 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 주문 할인 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdOrderDiscnt> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
