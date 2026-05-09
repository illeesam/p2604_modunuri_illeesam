package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyTemplateService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 템플릿 API — /api/bo/sy/template
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/template")
@RequiredArgsConstructor
public class BoSyTemplateController {
    private final BoSyTemplateService boSyTemplateService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplateDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyTemplateService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyTemplateDto.Item>>> list(@Valid @ModelAttribute SyTemplateDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyTemplateService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyTemplateDto.PageResponse>> page(@Valid @ModelAttribute SyTemplateDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyTemplateService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyTemplate>> create(@RequestBody SyTemplate body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyTemplateService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplate>> update(@PathVariable("id") String id, @RequestBody SyTemplate body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyTemplateService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplate>> upsert(@PathVariable("id") String id, @RequestBody SyTemplate body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyTemplateService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyTemplate>>> saveList(@RequestBody List<SyTemplate> rows) {
        return ResponseEntity.ok(ApiResponse.ok(boSyTemplateService.saveList(rows), "저장되었습니다."));
    }
}
