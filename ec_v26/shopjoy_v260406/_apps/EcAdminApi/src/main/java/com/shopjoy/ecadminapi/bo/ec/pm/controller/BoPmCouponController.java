package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmCouponService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCouponDto.Item>>> list(@Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCouponDto.PageResponse>> page(@Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponDto.Item>> getById(@PathVariable("id") String id) {
        PmCouponDto.Item result = boPmCouponService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCoupon>> create(@RequestBody PmCoupon body) {
        PmCoupon result = boPmCouponService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCoupon>> update(@PathVariable("id") String id, @RequestBody PmCoupon body) {
        PmCoupon result = boPmCouponService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCoupon>> upsert(@PathVariable("id") String id, @RequestBody PmCoupon body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmCouponService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmCouponDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.changeStatus(id, body.get("statusCd"))));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<PmCoupon>>> saveList(@RequestBody List<PmCoupon> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.saveList(rows), "저장되었습니다."));
    }
}