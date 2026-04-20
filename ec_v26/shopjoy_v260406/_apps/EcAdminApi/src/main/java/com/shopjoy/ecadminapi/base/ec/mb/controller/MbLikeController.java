package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbLikeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/mb/like")
@RequiredArgsConstructor
public class MbLikeController {

    private final MbLikeService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbLikeDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<MbLikeDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbLikeDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<MbLikeDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbLikeDto>> getById(@PathVariable String id) {
        MbLikeDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<MbLike>> create(@RequestBody MbLike entity) {
        MbLike result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbLike>> save(
            @PathVariable String id, @RequestBody MbLike entity) {
        entity.setLikeId(id);
        MbLike result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody MbLike entity) {
        entity.setLikeId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
