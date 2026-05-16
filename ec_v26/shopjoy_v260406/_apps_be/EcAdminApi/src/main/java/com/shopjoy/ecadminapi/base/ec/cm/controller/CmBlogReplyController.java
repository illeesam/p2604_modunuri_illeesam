package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogReplyService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-reply")
@RequiredArgsConstructor
public class CmBlogReplyController {

    private final CmBlogReplyService service;

    /* 게시물 댓글 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogReplyDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시물 댓글 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogReplyDto.Item>>> list(@Valid @ModelAttribute CmBlogReplyDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시물 댓글 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogReplyDto.PageResponse>> page(@Valid @ModelAttribute CmBlogReplyDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시물 댓글 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogReply>> create(@RequestBody CmBlogReply entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시물 댓글 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogReply>> save(@PathVariable("id") String id, @RequestBody CmBlogReply entity) {
        entity.setCommentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 게시물 댓글 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogReply>> updateSelective(@PathVariable("id") String id, @RequestBody CmBlogReply entity) {
        entity.setCommentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시물 댓글 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 게시물 댓글 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmBlogReply> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
