package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/discnt-item")
@RequiredArgsConstructor
public class PmDiscntItemController {

    private final PmDiscntItemService service;

    /* 할인 대상 상품 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 할인 대상 상품 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmDiscntItemDto.Item>>> list(@Valid @ModelAttribute PmDiscntItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 할인 대상 상품 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmDiscntItemDto.PageResponse>> page(@Valid @ModelAttribute PmDiscntItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 할인 대상 상품 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmDiscntItem>> create(@RequestBody PmDiscntItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 할인 대상 상품 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntItem>> save(@PathVariable("id") String id, @RequestBody PmDiscntItem entity) {
        entity.setDiscntItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 할인 대상 상품 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntItem>> updateSelective(@PathVariable("id") String id, @RequestBody PmDiscntItem entity) {
        entity.setDiscntItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 할인 대상 상품 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 할인 대상 상품 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmDiscntItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
