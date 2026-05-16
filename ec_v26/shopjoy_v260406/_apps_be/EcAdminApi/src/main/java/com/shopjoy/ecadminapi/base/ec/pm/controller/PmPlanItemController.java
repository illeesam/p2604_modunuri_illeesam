package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmPlanItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/plan-item")
@RequiredArgsConstructor
public class PmPlanItemController {

    private final PmPlanItemService service;

    /* 프로모션 플랜 아이템 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanItemDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 프로모션 플랜 아이템 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmPlanItemDto.Item>>> list(@Valid @ModelAttribute PmPlanItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 프로모션 플랜 아이템 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmPlanItemDto.PageResponse>> page(@Valid @ModelAttribute PmPlanItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 프로모션 플랜 아이템 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmPlanItem>> create(@RequestBody PmPlanItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 프로모션 플랜 아이템 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanItem>> save(@PathVariable("id") String id, @RequestBody PmPlanItem entity) {
        entity.setPlanItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 프로모션 플랜 아이템 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanItem>> updateSelective(@PathVariable("id") String id, @RequestBody PmPlanItem entity) {
        entity.setPlanItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 프로모션 플랜 아이템 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 프로모션 플랜 아이템 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmPlanItem> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
