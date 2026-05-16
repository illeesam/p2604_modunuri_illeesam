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

    /* 업체별 브랜드 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorBrandDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 업체별 브랜드 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorBrandDto.Item>>> list(@Valid @ModelAttribute SyVendorBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 업체별 브랜드 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorBrandDto.PageResponse>> page(@Valid @ModelAttribute SyVendorBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 업체별 브랜드 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorBrand>> create(@RequestBody SyVendorBrand entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 업체별 브랜드 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorBrand>> save(@PathVariable("id") String id, @RequestBody SyVendorBrand entity) {
        entity.setVendorBrandId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 업체별 브랜드 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorBrand>> updateSelective(@PathVariable("id") String id, @RequestBody SyVendorBrand entity) {
        entity.setVendorBrandId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 업체별 브랜드 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 업체별 브랜드 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVendorBrand> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
