package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.service.OdClaimItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/claim-item")
@RequiredArgsConstructor
public class OdClaimItemController {

    private final OdClaimItemService service;

    /* 클레임 아이템 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 클레임 아이템 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdClaimItemDto.Item>>> list(@Valid @ModelAttribute OdClaimItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 클레임 아이템 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdClaimItemDto.PageResponse>> page(@Valid @ModelAttribute OdClaimItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 클레임 아이템 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdClaimItem>> create(@RequestBody OdClaimItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 클레임 아이템 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimItem>> save(@PathVariable("id") String id, @RequestBody OdClaimItem entity) {
        entity.setClaimItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 클레임 아이템 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdClaimItem>> updateSelective(@PathVariable("id") String id, @RequestBody OdClaimItem entity) {
        entity.setClaimItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 클레임 아이템 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 클레임 아이템 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdClaimItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
