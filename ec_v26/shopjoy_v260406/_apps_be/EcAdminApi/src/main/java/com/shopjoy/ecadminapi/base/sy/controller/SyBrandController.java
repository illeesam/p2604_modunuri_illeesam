package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.service.SyBrandService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/brand")
@RequiredArgsConstructor
public class SyBrandController {

    private final SyBrandService service;

    /* 브랜드 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBrandDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 브랜드 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBrandDto.Item>>> list(@Valid @ModelAttribute SyBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 브랜드 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBrandDto.PageResponse>> page(@Valid @ModelAttribute SyBrandDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 브랜드 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyBrand>> create(@RequestBody SyBrand entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 브랜드 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBrand>> save(@PathVariable("id") String id, @RequestBody SyBrand entity) {
        entity.setBrandId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 브랜드 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBrand>> updateSelective(@PathVariable("id") String id, @RequestBody SyBrand entity) {
        entity.setBrandId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 브랜드 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyBrand>> saveDefault(@RequestBody SyBrand entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyBrand>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyBrand entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBrand> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyBrand> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
