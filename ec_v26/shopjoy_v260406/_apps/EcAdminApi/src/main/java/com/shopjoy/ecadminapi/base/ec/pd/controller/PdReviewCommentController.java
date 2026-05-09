package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdReviewCommentService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/review-comment")
@RequiredArgsConstructor
public class PdReviewCommentController {

    private final PdReviewCommentService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewCommentDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdReviewCommentDto.Item>>> list(@Valid @ModelAttribute PdReviewCommentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdReviewCommentDto.PageResponse>> page(@Valid @ModelAttribute PdReviewCommentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdReviewComment>> create(@RequestBody PdReviewComment entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewComment>> save(@PathVariable("id") String id, @RequestBody PdReviewComment entity) {
        entity.setReviewCommentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewComment>> updatePartial(@PathVariable("id") String id, @RequestBody PdReviewComment entity) {
        entity.setReviewCommentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdReviewComment> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
