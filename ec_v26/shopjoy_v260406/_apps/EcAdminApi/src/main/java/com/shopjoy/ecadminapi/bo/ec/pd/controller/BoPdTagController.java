package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdTagService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 태그 API — /api/bo/ec/pd/tag
 */
@RestController
@RequestMapping("/api/bo/ec/pd/tag")
@RequiredArgsConstructor
public class BoPdTagController {
    private final BoPdTagService boPdTagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdTagDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdTagDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTagDto>> getById(@PathVariable("id") String id) {
        PdTagDto result = boPdTagService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdTag>> create(@RequestBody PdTag body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boPdTagService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTagDto>> update(@PathVariable("id") String id, @RequestBody PdTag body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTagDto>> upsert(@PathVariable("id") String id, @RequestBody PdTag body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdTagService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdTagService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdTag> rows) {
        boPdTagService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
