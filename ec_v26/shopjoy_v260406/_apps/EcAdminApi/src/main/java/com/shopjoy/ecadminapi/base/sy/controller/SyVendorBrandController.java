package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorBrandService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/vendor-brand")
@RequiredArgsConstructor
public class SyVendorBrandController {

    private final SyVendorBrandService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorBrandDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorBrandDto.Item>>> list(@Valid @ModelAttribute SyVendorBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorBrandDto.PageResponse>> page(@Valid @ModelAttribute SyVendorBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorBrand>> create(@RequestBody SyVendorBrand entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorBrand>> save(@PathVariable("id") String id, @RequestBody SyVendorBrand entity) {
        entity.setVendorBrandId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorBrand>> updatePartial(@PathVariable("id") String id, @RequestBody SyVendorBrand entity) {
        entity.setVendorBrandId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<SyVendorBrand>>> saveList(@RequestBody List<SyVendorBrand> rows) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveList(rows), "저장되었습니다."));
    }
}
