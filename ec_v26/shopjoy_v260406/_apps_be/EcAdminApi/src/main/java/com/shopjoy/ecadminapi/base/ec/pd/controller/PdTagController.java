package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdTagService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/tag")
@RequiredArgsConstructor
public class PdTagController {

    private final PdTagService service;

    /* 태그 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTagDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 태그 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdTagDto.Item>>> list(@Valid @ModelAttribute PdTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 태그 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdTagDto.PageResponse>> page(@Valid @ModelAttribute PdTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 태그 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdTag>> create(@RequestBody PdTag entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 태그 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTag>> save(@PathVariable("id") String id, @RequestBody PdTag entity) {
        entity.setTagId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 태그 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTag>> updateSelective(@PathVariable("id") String id, @RequestBody PdTag entity) {
        entity.setTagId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 태그 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 태그 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdTag> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
