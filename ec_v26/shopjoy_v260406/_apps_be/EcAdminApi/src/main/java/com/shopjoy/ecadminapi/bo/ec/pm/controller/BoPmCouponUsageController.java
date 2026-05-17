package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponUsageService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 쿠폰사용이력 API — /api/bo/ec/pm/coupon-usage
 * 인가: BO_ONLY (관리자). 비즈니스 로직 없는 단순 CRUD 위임이므로
 * base PmCouponUsageService 직접 주입 (base.기술-api §3.5 예외 허용).
 */
@RestController
@RequestMapping("/api/bo/ec/pm/coupon-usage")
@RequiredArgsConstructor
public class BoPmCouponUsageController {

    private final PmCouponUsageService service;

    /* 쿠폰 사용 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponUsageDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 쿠폰 사용 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCouponUsageDto.Item>>> list(@Valid @ModelAttribute PmCouponUsageDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 쿠폰 사용 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCouponUsageDto.PageResponse>> page(@Valid @ModelAttribute PmCouponUsageDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 쿠폰 사용 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCouponUsage>> create(@RequestBody PmCouponUsage entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 쿠폰 사용 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponUsage>> save(@PathVariable("id") String id, @RequestBody PmCouponUsage entity) {
        entity.setUsageId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 쿠폰 사용 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponUsage>> updateSelective(@PathVariable("id") String id, @RequestBody PmCouponUsage entity) {
        entity.setUsageId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 쿠폰 사용 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 쿠폰 사용 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCouponUsage> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
