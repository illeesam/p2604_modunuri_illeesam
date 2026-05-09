package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdTagService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-tag")
@RequiredArgsConstructor
public class PdProdTagController {

    private final PdProdTagService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdTagDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdTagDto.Item>>> list(@Valid @ModelAttribute PdProdTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdTagDto.PageResponse>> page(@Valid @ModelAttribute PdProdTagDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdProdTag>> create(@RequestBody PdProdTag entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdTag>> save(@PathVariable("id") String id, @RequestBody PdProdTag entity) {
        entity.setProdTagId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdTag>> updatePartial(@PathVariable("id") String id, @RequestBody PdProdTag entity) {
        entity.setProdTagId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdTag> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
