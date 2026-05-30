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

    /* 리뷰 댓글 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewCommentDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 리뷰 댓글 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdReviewCommentDto.Item>>> list(@Valid @ModelAttribute PdReviewCommentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 리뷰 댓글 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdReviewCommentDto.PageResponse>> page(@Valid @ModelAttribute PdReviewCommentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 리뷰 댓글 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdReviewComment>> create(@RequestBody PdReviewComment entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 리뷰 댓글 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewComment>> save(@PathVariable("id") String id, @RequestBody PdReviewComment entity) {
        entity.setReviewCommentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 리뷰 댓글 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewComment>> updateSelective(@PathVariable("id") String id, @RequestBody PdReviewComment entity) {
        entity.setReviewCommentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 리뷰 댓글 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<PdReviewComment>> saveDefault(@RequestBody PdReviewComment entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdReviewComment>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdReviewComment entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdReviewComment> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdReviewComment> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
