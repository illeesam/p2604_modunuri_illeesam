package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponItemService;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmCouponService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 쿠폰 API — /api/bo/ec/pm/coupon
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/coupon")
@RequiredArgsConstructor
public class BoPmCouponController {
    private final BoPmCouponService boPmCouponService;
    private final PmCouponItemService pmCouponItemService;

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
            @PathVariable("id") String id, @RequestBody PmCouponChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCouponService.changeStatus(id, req.getStatusCd())));
    }
    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmCoupon> rows) {
        switch (cmd) {
            case "base" -> boPmCouponService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* ── 쿠폰 대상상품 (item) 서브 API ─────────────────── */

    /** 상품에 연결된 쿠폰 항목 목록 조회 */
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<PmCouponItemDto.Item>>> listItems(
            @Valid @ModelAttribute PmCouponItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(pmCouponItemService.getList(req)));
    }

    /** 쿠폰 항목 등록 (상품을 쿠폰에 연결) */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<PmCouponItem>> createItem(@RequestBody PmCouponItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(pmCouponItemService.create(entity)));
    }

    /** 쿠폰 항목 삭제 (상품을 쿠폰에서 제거) */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable("itemId") String itemId) {
        pmCouponItemService.delete(itemId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}