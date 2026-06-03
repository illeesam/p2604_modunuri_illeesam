package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.service.SyTemplateService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyTemplate>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyTemplate entity) {
        SyTemplate result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyTemplate> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
