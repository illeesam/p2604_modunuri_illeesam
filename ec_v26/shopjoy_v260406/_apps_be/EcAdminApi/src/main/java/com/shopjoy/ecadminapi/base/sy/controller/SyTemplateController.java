package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.service.SyTemplateService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/template")
@RequiredArgsConstructor
public class SyTemplateController {

    private final SyTemplateService service;

    /* 템플릿 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplateDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 템플릿 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyTemplateDto.Item>>> list(@Valid @ModelAttribute SyTemplateDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 템플릿 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyTemplateDto.PageResponse>> page(@Valid @ModelAttribute SyTemplateDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 템플릿 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyTemplate>> create(@RequestBody SyTemplate entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 템플릿 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplate>> save(@PathVariable("id") String id, @RequestBody SyTemplate entity) {
        entity.setTemplateId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 템플릿 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplate>> updateSelective(@PathVariable("id") String id, @RequestBody SyTemplate entity) {
        entity.setTemplateId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 템플릿 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 템플릿 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyTemplate> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
