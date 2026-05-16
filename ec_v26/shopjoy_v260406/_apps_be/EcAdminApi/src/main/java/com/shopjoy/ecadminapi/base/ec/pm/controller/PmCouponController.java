package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/coupon")
@RequiredArgsConstructor
public class PmCouponController {

    private final PmCouponService service;

    /* 쿠폰 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 쿠폰 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCouponDto.Item>>> list(@Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 쿠폰 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCouponDto.PageResponse>> page(@Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 쿠폰 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCoupon>> create(@RequestBody PmCoupon entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 쿠폰 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCoupon>> save(@PathVariable("id") String id, @RequestBody PmCoupon entity) {
        entity.setCouponId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 쿠폰 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCoupon>> updateSelective(@PathVariable("id") String id, @RequestBody PmCoupon entity) {
        entity.setCouponId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 쿠폰 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 쿠폰 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCoupon> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
