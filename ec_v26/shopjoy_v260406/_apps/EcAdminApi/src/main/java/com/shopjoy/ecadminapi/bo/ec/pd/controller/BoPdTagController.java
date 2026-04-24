package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
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
@BoOnly
public class BoPdTagController {
    private final BoPdTagService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdTagDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdTagDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdTag>> create(@RequestBody PdTag body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdTagDto>> update(@PathVariable String id, @RequestBody PdTag body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
