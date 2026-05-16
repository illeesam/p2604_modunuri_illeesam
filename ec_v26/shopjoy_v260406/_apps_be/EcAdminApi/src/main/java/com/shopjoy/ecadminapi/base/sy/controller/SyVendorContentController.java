package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorContentService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/vendor-content")
@RequiredArgsConstructor
public class SyVendorContentController {

    private final SyVendorContentService service;

    /* 업체 콘텐츠 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorContentDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 업체 콘텐츠 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorContentDto.Item>>> list(@Valid @ModelAttribute SyVendorContentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 업체 콘텐츠 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVendorContentDto.PageResponse>> page(@Valid @ModelAttribute SyVendorContentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 업체 콘텐츠 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVendorContent>> create(@RequestBody SyVendorContent entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 업체 콘텐츠 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorContent>> save(@PathVariable("id") String id, @RequestBody SyVendorContent entity) {
        entity.setVendorContentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 업체 콘텐츠 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorContent>> updateSelective(@PathVariable("id") String id, @RequestBody SyVendorContent entity) {
        entity.setVendorContentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 업체 콘텐츠 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 업체 콘텐츠 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVendorContent> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
