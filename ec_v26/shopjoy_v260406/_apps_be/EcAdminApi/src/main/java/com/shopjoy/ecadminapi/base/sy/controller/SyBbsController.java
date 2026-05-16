package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.service.SyBbsService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/bbs")
@RequiredArgsConstructor
public class SyBbsController {

    private final SyBbsService service;

    /* 게시판 게시물 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbsDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시판 게시물 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBbsDto.Item>>> list(@Valid @ModelAttribute SyBbsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시판 게시물 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBbsDto.PageResponse>> page(@Valid @ModelAttribute SyBbsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시판 게시물 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyBbs>> create(@RequestBody SyBbs entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시판 게시물 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbs>> save(@PathVariable("id") String id, @RequestBody SyBbs entity) {
        entity.setBbsId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 게시판 게시물 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbs>> updateSelective(@PathVariable("id") String id, @RequestBody SyBbs entity) {
        entity.setBbsId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시판 게시물 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 게시판 게시물 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBbs> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
