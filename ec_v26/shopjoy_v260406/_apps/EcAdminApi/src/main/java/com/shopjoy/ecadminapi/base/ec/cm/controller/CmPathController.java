package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmPathService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/path")
@RequiredArgsConstructor
public class CmPathController {

    private final CmPathService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmPathDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmPathDto.Item>>> list(@Valid @ModelAttribute CmPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmPathDto.PageResponse>> page(@Valid @ModelAttribute CmPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmPath>> create(@RequestBody CmPath entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmPath>> save(@PathVariable("id") String id, @RequestBody CmPath entity) {
        entity.setBizCd(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmPath>> updatePartial(@PathVariable("id") String id, @RequestBody CmPath entity) {
        entity.setBizCd(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmPath> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
