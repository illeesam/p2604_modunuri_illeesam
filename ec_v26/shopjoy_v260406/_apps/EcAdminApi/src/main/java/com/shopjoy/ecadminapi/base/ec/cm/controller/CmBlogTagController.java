package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogTagService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-tag")
@RequiredArgsConstructor
public class CmBlogTagController {

    private final CmBlogTagService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogTagDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogTagDto.Item>>> list(@Valid @ModelAttribute CmBlogTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogTagDto.PageResponse>> page(@Valid @ModelAttribute CmBlogTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogTag>> create(@RequestBody CmBlogTag entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogTag>> save(@PathVariable("id") String id, @RequestBody CmBlogTag entity) {
        entity.setBlogTagId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogTag>> updatePartial(@PathVariable("id") String id, @RequestBody CmBlogTag entity) {
        entity.setBlogTagId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmBlogTag> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
