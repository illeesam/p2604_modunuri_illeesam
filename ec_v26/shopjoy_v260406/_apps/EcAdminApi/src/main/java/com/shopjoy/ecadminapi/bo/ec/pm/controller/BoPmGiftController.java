package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmGiftService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
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

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmGiftDto.Item>>> list(@Valid @ModelAttribute PmGiftDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmGiftService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmGiftDto.PageResponse>> page(@Valid @ModelAttribute PmGiftDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmGiftService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftDto.Item>> getById(@PathVariable("id") String id) {
        PmGiftDto.Item result = boPmGiftService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmGift>> create(@RequestBody PmGift body) {
        PmGift result = boPmGiftService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGift>> update(@PathVariable("id") String id, @RequestBody PmGift body) {
        PmGift result = boPmGiftService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGift>> upsert(@PathVariable("id") String id, @RequestBody PmGift body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmGiftService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmGiftService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PmGiftDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmGiftService.changeStatus(id, body.get("statusCd"))));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmGift> rows) {
        boPmGiftService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}