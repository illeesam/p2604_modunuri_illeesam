package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/i18n")
@RequiredArgsConstructor
public class SyI18nController {

    private final SyI18nService service;

    /* 다국어 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18nDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 다국어 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyI18nDto.Item>>> list(@Valid @ModelAttribute SyI18nDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 다국어 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyI18nDto.PageResponse>> page(@Valid @ModelAttribute SyI18nDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 다국어 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyI18n>> create(@RequestBody SyI18n entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 다국어 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18n>> save(@PathVariable("id") String id, @RequestBody SyI18n entity) {
        entity.setI18nId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 다국어 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18n>> updateSelective(@PathVariable("id") String id, @RequestBody SyI18n entity) {
        entity.setI18nId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 다국어 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyI18n>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyI18n entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyI18n> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
