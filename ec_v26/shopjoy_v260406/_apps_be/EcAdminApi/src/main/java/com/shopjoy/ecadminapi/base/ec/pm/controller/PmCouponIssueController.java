package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponIssueService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/coupon-issue")
@RequiredArgsConstructor
public class PmCouponIssueController {

    private final PmCouponIssueService service;

    /* 쿠폰 발행 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponIssueDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 쿠폰 발행 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCouponIssueDto.Item>>> list(@Valid @ModelAttribute PmCouponIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 쿠폰 발행 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCouponIssueDto.PageResponse>> page(@Valid @ModelAttribute PmCouponIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 쿠폰 발행 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCouponIssue>> create(@RequestBody PmCouponIssue entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 쿠폰 발행 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponIssue>> save(@PathVariable("id") String id, @RequestBody PmCouponIssue entity) {
        entity.setIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 쿠폰 발행 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCouponIssue>> updateSelective(@PathVariable("id") String id, @RequestBody PmCouponIssue entity) {
        entity.setIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 쿠폰 발행 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 쿠폰 발행 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCouponIssue> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
