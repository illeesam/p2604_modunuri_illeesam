package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogCateService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-cate")
@RequiredArgsConstructor
public class CmBlogCateController {

    private final CmBlogCateService service;

    /* 게시판 카테고리 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogCateDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시판 카테고리 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogCateDto.Item>>> list(@Valid @ModelAttribute CmBlogCateDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시판 카테고리 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogCateDto.PageResponse>> page(@Valid @ModelAttribute CmBlogCateDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시판 카테고리 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogCate>> create(@RequestBody CmBlogCate entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시판 카테고리 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogCate>> save(@PathVariable("id") String id, @RequestBody CmBlogCate entity) {
        entity.setBlogCateId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 게시판 카테고리 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogCate>> updateSelective(@PathVariable("id") String id, @RequestBody CmBlogCate entity) {
        entity.setBlogCateId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시판 카테고리 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 게시판 카테고리 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmBlogCate> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
