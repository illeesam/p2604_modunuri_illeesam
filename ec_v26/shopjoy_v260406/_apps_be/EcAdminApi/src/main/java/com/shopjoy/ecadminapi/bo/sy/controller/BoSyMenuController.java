package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyMenuService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 메뉴 API — /api/bo/sy/menu
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/menu")
@RequiredArgsConstructor
public class BoSyMenuController {
    private final BoSyMenuService boSyMenuService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenuDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyMenuService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyMenuDto.Item>>> list(@Valid @ModelAttribute SyMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyMenuService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyMenuDto.PageResponse>> page(@Valid @ModelAttribute SyMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyMenuService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyMenu>> create(@RequestBody SyMenu body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyMenuService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenu>> update(@PathVariable("id") String id, @RequestBody SyMenu body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyMenuService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenu>> upsert(@PathVariable("id") String id, @RequestBody SyMenu body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyMenuService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyMenuService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyMenu> rows) {
        boSyMenuService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
