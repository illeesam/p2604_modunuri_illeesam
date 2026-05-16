package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbLikeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/like")
@RequiredArgsConstructor
public class MbLikeController {

    private final MbLikeService service;

    /* 좋아요(찜) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbLikeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 좋아요(찜) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbLikeDto.Item>>> list(@Valid @ModelAttribute MbLikeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 좋아요(찜) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbLikeDto.PageResponse>> page(@Valid @ModelAttribute MbLikeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 좋아요(찜) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbLike>> create(@RequestBody MbLike entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 좋아요(찜) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbLike>> save(@PathVariable("id") String id, @RequestBody MbLike entity) {
        entity.setLikeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 좋아요(찜) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbLike>> updateSelective(@PathVariable("id") String id, @RequestBody MbLike entity) {
        entity.setLikeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 좋아요(찜) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 좋아요(찜) 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbLike> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
