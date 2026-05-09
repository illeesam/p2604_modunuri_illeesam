package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyI18nService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 다국어 API — /api/bo/sy/i18n
 */
@RestController
@RequestMapping("/api/bo/sy/i18n")
@RequiredArgsConstructor
public class BoSyI18nController {

    private final BoSyI18nService boSyI18nService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18nDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyI18nService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyI18nDto.Item>>> list(@Valid @ModelAttribute SyI18nDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyI18nService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyI18nDto.PageResponse>> page(@Valid @ModelAttribute SyI18nDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyI18nService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyI18n>> create(@RequestBody SyI18n body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyI18nService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18n>> update(@PathVariable("id") String id, @RequestBody SyI18n body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyI18nService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18n>> upsert(@PathVariable("id") String id, @RequestBody SyI18n body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyI18nService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyI18nService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveMsgs — 다국어 메시지 일괄 저장 */
    @PutMapping("/{id}/msgs")
    public ResponseEntity<ApiResponse<Void>> saveMsgs(
            @PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, String> msgs = (Map<String, String>) body.get("msgs");
        if (msgs == null) return ResponseEntity.ok(ApiResponse.ok(null));
        boSyI18nService.saveMsgs(id, msgs);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
