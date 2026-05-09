package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/code")
@RequiredArgsConstructor
public class SyCodeController {

    private final SyCodeService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> list(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeDto.PageResponse>> page(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyCode>> create(@RequestBody SyCode entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> save(@PathVariable("id") String id, @RequestBody SyCode entity) {
        entity.setCodeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> updatePartial(@PathVariable("id") String id, @RequestBody SyCode entity) {
        entity.setCodeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyCode> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
