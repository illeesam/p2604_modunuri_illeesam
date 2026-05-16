package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/save-item")
@RequiredArgsConstructor
public class PmSaveItemController {

    private final PmSaveItemService service;

    /* 적립금 대상 상품 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 적립금 대상 상품 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveItemDto.Item>>> list(@Valid @ModelAttribute PmSaveItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 적립금 대상 상품 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmSaveItemDto.PageResponse>> page(@Valid @ModelAttribute PmSaveItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 적립금 대상 상품 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSaveItem>> create(@RequestBody PmSaveItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 적립금 대상 상품 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveItem>> save(@PathVariable("id") String id, @RequestBody PmSaveItem entity) {
        entity.setSaveItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 적립금 대상 상품 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveItem>> updateSelective(@PathVariable("id") String id, @RequestBody PmSaveItem entity) {
        entity.setSaveItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 적립금 대상 상품 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 적립금 대상 상품 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmSaveItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
