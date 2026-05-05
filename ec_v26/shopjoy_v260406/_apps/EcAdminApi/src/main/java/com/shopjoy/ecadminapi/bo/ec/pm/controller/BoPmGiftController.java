package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmGiftService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 사은품 API — /api/bo/ec/pm/gift
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/gift")
@RequiredArgsConstructor
public class BoPmGiftController {
    private final BoPmGiftService boPmGiftService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmGiftDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PmGiftDto> result = boPmGiftService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmGiftDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PmGiftDto> result = boPmGiftService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftDto>> getById(@PathVariable("id") String id) {
        PmGiftDto result = boPmGiftService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PmGift>> create(@RequestBody PmGift body) {
        PmGift result = boPmGiftService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftDto>> update(@PathVariable("id") String id, @RequestBody PmGift body) {
        PmGiftDto result = boPmGiftService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftDto>> upsert(@PathVariable("id") String id, @RequestBody PmGift body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmGiftService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmGiftService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmGiftDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        PmGiftDto result = boPmGiftService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmGift> rows) {
        boPmGiftService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}