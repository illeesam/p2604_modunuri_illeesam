package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmCouponService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 쿠폰 API — /api/bo/ec/pm/coupon
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/coupon")
@RequiredArgsConstructor
public class BoPmCouponController {
    private final BoPmCouponService boPmCouponService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCouponDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PmCouponDto> result = boPmCouponService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmCouponDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PmCouponDto> result = boPmCouponService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponDto>> getById(@PathVariable("id") String id) {
        PmCouponDto result = boPmCouponService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PmCoupon>> create(@RequestBody PmCoupon body) {
        PmCoupon result = boPmCouponService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponDto>> update(@PathVariable("id") String id, @RequestBody PmCoupon body) {
        PmCouponDto result = boPmCouponService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponDto>> upsert(@PathVariable("id") String id, @RequestBody PmCoupon body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmCouponService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmCouponDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        PmCouponDto result = boPmCouponService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCoupon> rows) {
        boPmCouponService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}