package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdReviewService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/review")
@RequiredArgsConstructor
public class PdReviewController {

    private final PdReviewService service;

    /* 상품 리뷰 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 리뷰 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdReviewDto.Item>>> list(@Valid @ModelAttribute PdReviewDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 리뷰 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdReviewDto.PageResponse>> page(@Valid @ModelAttribute PdReviewDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 리뷰 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdReview>> create(@RequestBody PdReview entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 리뷰 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReview>> save(@PathVariable("id") String id, @RequestBody PdReview entity) {
        entity.setReviewId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 리뷰 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReview>> updateSelective(@PathVariable("id") String id, @RequestBody PdReview entity) {
        entity.setReviewId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 리뷰 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 리뷰 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdReview> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
