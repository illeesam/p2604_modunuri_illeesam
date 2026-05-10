package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmBlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FO 게시물(블로그/FAQ/공지) API — /api/fo/ec/cm/bltn
 */
@RestController
@RequestMapping("/api/fo/ec/cm/bltn")
@RequiredArgsConstructor
public class FoCmBlogController {

    private final FoCmBlogService foCmBlogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogDto.Item>>> list(@Valid @ModelAttribute CmBlogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foCmBlogService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogDto.PageResponse>> page(@Valid @ModelAttribute CmBlogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foCmBlogService.getPageData(req)));
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<ApiResponse<CmBlogDto.Item>> getById(@PathVariable("blogId") String blogId) {
        return ResponseEntity.ok(ApiResponse.ok(foCmBlogService.getByIdAndIncrView(blogId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmBlog>> create(@RequestBody CmBlog entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(foCmBlogService.create(entity)));
    }

    @PutMapping("/{blogId}")
    public ResponseEntity<ApiResponse<CmBlog>> update(
            @PathVariable("blogId") String blogId, @RequestBody CmBlog entity) {
        return ResponseEntity.ok(ApiResponse.ok(foCmBlogService.update(blogId, entity)));
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("blogId") String blogId) {
        foCmBlogService.delete(blogId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
