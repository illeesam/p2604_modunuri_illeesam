package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogGoodService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-good")
@RequiredArgsConstructor
public class CmBlogGoodController {

    private final CmBlogGoodService service;

    /* 게시물 좋아요 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogGoodDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시물 좋아요 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogGoodDto.Item>>> list(@Valid @ModelAttribute CmBlogGoodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시물 좋아요 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogGoodDto.PageResponse>> page(@Valid @ModelAttribute CmBlogGoodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시물 좋아요 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogGood>> create(@RequestBody CmBlogGood entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시물 좋아요 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogGood>> save(@PathVariable("id") String id, @RequestBody CmBlogGood entity) {
        entity.setLikeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 게시물 좋아요 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogGood>> updateSelective(@PathVariable("id") String id, @RequestBody CmBlogGood entity) {
        entity.setLikeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시물 좋아요 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<CmBlogGood>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody CmBlogGood entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<CmBlogGood> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
