package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdTagService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 태그 API — /api/bo/ec/pd/tag
 */
@RestController
@RequestMapping("/api/bo/ec/pd/tag")
@RequiredArgsConstructor
public class BoPdTagController {
    private final BoPdTagService boPdTagService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdTagDto.Item>>> list(@Valid @ModelAttribute PdTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdTagDto.PageResponse>> page(@Valid @ModelAttribute PdTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTagDto.Item>> getById(@PathVariable("id") String id) {
        PdTagDto.Item result = boPdTagService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdTag>> create(@RequestBody PdTag body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boPdTagService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTag>> update(@PathVariable("id") String id, @RequestBody PdTag body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTag>> upsert(@PathVariable("id") String id, @RequestBody PdTag body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdTagService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<PdTag>>> saveList(@RequestBody List<PdTag> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.saveList(rows), "저장되었습니다."));
    }
}
