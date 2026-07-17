package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveItemService;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmSaveService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 적립금 API — /api/bo/ec/pm/save
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/save")
@RequiredArgsConstructor
public class BoPmSaveController {
    private final BoPmSaveService boPmSaveService;
    private final PmSaveItemService pmSaveItemService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveDto.Item>>> list(@Valid @ModelAttribute PmSaveDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmSaveService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmSaveDto.PageResponse>> page(@Valid @ModelAttribute PmSaveDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmSaveService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto.Item>> getById(@PathVariable("id") String id) {
        PmSaveDto.Item result = boPmSaveService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSave>> create(@RequestBody PmSave body) {
        PmSave result = boPmSaveService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> update(@PathVariable("id") String id, @RequestBody PmSave body) {
        PmSave result = boPmSaveService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> upsert(@PathVariable("id") String id, @RequestBody PmSave body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmSaveService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmSaveService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmSave> rows) {
        switch (cmd) {
            case "base" -> boPmSaveService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* ── 적립금 대상상품 (item) 서브 API ─────────────────── */

    /** 상품에 연결된 적립금 항목 목록 조회 */
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<PmSaveItemDto.Item>>> listItems(
            @Valid @ModelAttribute PmSaveItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(pmSaveItemService.getList(req)));
    }

    /** 적립금 항목 등록 (상품을 적립금에 연결) */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<PmSaveItem>> createItem(@RequestBody PmSaveItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(pmSaveItemService.create(entity)));
    }

    /** 적립금 항목 삭제 (상품을 적립금에서 제거) */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable("itemId") String itemId) {
        pmSaveItemService.delete(itemId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
