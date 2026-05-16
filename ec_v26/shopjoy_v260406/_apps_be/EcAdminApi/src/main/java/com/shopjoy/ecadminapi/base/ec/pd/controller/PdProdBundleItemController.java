package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdBundleItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-bundle-item")
@RequiredArgsConstructor
public class PdProdBundleItemController {

    private final PdProdBundleItemService service;

    /* 묶음상품 구성 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdBundleItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 묶음상품 구성 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdBundleItemDto.Item>>> list(@Valid @ModelAttribute PdProdBundleItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 묶음상품 구성 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdBundleItemDto.PageResponse>> page(@Valid @ModelAttribute PdProdBundleItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 묶음상품 구성 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdBundleItem>> create(@RequestBody PdProdBundleItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 묶음상품 구성 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdBundleItem>> save(@PathVariable("id") String id, @RequestBody PdProdBundleItem entity) {
        entity.setBundleItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 묶음상품 구성 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdBundleItem>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdBundleItem entity) {
        entity.setBundleItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 묶음상품 구성 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 묶음상품 구성 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdBundleItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
