package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbsService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 게시판 API — /api/bo/sy/bbs
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/bbs")
@RequiredArgsConstructor
public class BoSyBbsController {
    private final BoSyBbsService boSyBbsService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbsDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBbsDto.Item>>> list(@Valid @ModelAttribute SyBbsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBbsDto.PageResponse>> page(@Valid @ModelAttribute SyBbsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyBbs>> create(@RequestBody SyBbs body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyBbsService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbs>> update(@PathVariable("id") String id, @RequestBody SyBbs body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbs>> upsert(@PathVariable("id") String id, @RequestBody SyBbs body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyBbsService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyBbs>>> saveList(@RequestBody List<SyBbs> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyBbsService.saveList(rows), "저장되었습니다."));
    }
}
