package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-opt-item")
@RequiredArgsConstructor
public class PdProdOptItemController {

    private final PdProdOptItemService service;

    /* 상품 옵션 아이템 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 옵션 아이템 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdOptItemDto.Item>>> list(@Valid @ModelAttribute PdProdOptItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 옵션 아이템 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdOptItemDto.PageResponse>> page(@Valid @ModelAttribute PdProdOptItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 옵션 아이템 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdOptItem>> create(@RequestBody PdProdOptItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 옵션 아이템 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptItem>> save(@PathVariable("id") String id, @RequestBody PdProdOptItem entity) {
        entity.setOptItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 옵션 아이템 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptItem>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdOptItem entity) {
        entity.setOptItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 옵션 아이템 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 옵션 아이템 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdOptItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
