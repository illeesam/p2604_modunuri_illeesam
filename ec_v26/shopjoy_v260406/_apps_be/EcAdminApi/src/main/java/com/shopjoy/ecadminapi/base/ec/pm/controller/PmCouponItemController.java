package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/coupon-item")
@RequiredArgsConstructor
public class PmCouponItemController {

    private final PmCouponItemService service;

    /* 쿠폰 대상 상품 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 쿠폰 대상 상품 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCouponItemDto.Item>>> list(@Valid @ModelAttribute PmCouponItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 쿠폰 대상 상품 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCouponItemDto.PageResponse>> page(@Valid @ModelAttribute PmCouponItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 쿠폰 대상 상품 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCouponItem>> create(@RequestBody PmCouponItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 쿠폰 대상 상품 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponItem>> save(@PathVariable("id") String id, @RequestBody PmCouponItem entity) {
        entity.setCouponItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 쿠폰 대상 상품 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponItem>> updateSelective(@PathVariable("id") String id, @RequestBody PmCouponItem entity) {
        entity.setCouponItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 쿠폰 대상 상품 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 쿠폰 대상 상품 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCouponItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
