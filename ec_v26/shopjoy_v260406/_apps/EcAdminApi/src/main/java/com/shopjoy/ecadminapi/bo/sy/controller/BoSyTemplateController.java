package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyTemplateService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 템플릿 API — /api/bo/sy/template
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/template")
@RequiredArgsConstructor
@UserOnly
public class BoSyTemplateController {
    private final BoSyTemplateService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyTemplateDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<SyTemplateDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyTemplateDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<SyTemplateDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyTemplate>> create(@RequestBody SyTemplate body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyTemplateDto>> update(@PathVariable String id, @RequestBody SyTemplate body) {
        SyTemplateDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
