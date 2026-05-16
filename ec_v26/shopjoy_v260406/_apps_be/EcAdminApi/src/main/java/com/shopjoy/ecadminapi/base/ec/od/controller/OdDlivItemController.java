package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/dliv-item")
@RequiredArgsConstructor
public class OdDlivItemController {

    private final OdDlivItemService service;

    /* 배송 아이템 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배송 아이템 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivItemDto.Item>>> list(@Valid @ModelAttribute OdDlivItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배송 아이템 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdDlivItemDto.PageResponse>> page(@Valid @ModelAttribute OdDlivItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배송 아이템 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdDlivItem>> create(@RequestBody OdDlivItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배송 아이템 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivItem>> save(@PathVariable("id") String id, @RequestBody OdDlivItem entity) {
        entity.setDlivItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 배송 아이템 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivItem>> updateSelective(@PathVariable("id") String id, @RequestBody OdDlivItem entity) {
        entity.setDlivItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 배송 아이템 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 배송 아이템 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdDlivItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
