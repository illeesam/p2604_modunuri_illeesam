package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbsService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 게시판 API — /api/bo/sy/bbs
 */
@RestController
@RequestMapping("/api/bo/sy/bbs")
@RequiredArgsConstructor
public class BoSyBbsController {
    private final BoSyBbsService boSyBbsService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBbsDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyBbsDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbsDto>> getById(@PathVariable("id") String id) {
        SyBbsDto result = boSyBbsService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyBbs>> create(@RequestBody SyBbs body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyBbsService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbsDto>> update(@PathVariable("id") String id, @RequestBody SyBbs body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbsDto>> upsert(@PathVariable("id") String id, @RequestBody SyBbs body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyBbsService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBbs> rows) {
        boSyBbsService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}