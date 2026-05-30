package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSetItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-set-item")
@RequiredArgsConstructor
public class PdProdSetItemController {

    private final PdProdSetItemService service;

    /* 세트상품 구성 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdSetItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 세트상품 구성 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdSetItemDto.Item>>> list(@Valid @ModelAttribute PdProdSetItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 세트상품 구성 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdSetItemDto.PageResponse>> page(@Valid @ModelAttribute PdProdSetItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 세트상품 구성 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdSetItem>> create(@RequestBody PdProdSetItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 세트상품 구성 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdSetItem>> save(@PathVariable("id") String id, @RequestBody PdProdSetItem entity) {
        entity.setSetItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 세트상품 구성 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdSetItem>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdSetItem entity) {
        entity.setSetItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 세트상품 구성 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<PdProdSetItem>> saveDefault(@RequestBody PdProdSetItem entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdProdSetItem>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdProdSetItem entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdSetItem> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdProdSetItem> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
