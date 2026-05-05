package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.bo.sy.service.BoSySiteService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 사이트 API — /api/bo/sy/site
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/site")
@RequiredArgsConstructor
public class BoSySiteController {
    private final BoSySiteService boSySiteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SySiteDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SySiteDto> result = boSySiteService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SySiteDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SySiteDto> result = boSySiteService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SySiteDto>> getById(@PathVariable("id") String id) {
        SySiteDto result = boSySiteService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SySite>> create(@RequestBody SySite body) {
        SySite result = boSySiteService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SySiteDto>> update(@PathVariable("id") String id, @RequestBody SySite body) {
        SySiteDto result = boSySiteService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SySiteDto>> upsert(@PathVariable("id") String id, @RequestBody SySite body) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSySiteService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SySite> rows) {
        boSySiteService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
