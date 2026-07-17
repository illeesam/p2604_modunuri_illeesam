package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftCondService;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmGiftService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 사은품 API — /api/bo/ec/pm/gift
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/gift")
@RequiredArgsConstructor
public class BoPmGiftController {
    private final BoPmGiftService boPmGiftService;
    private final PmGiftCondService pmGiftCondService;

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
            @PathVariable("id") String id, @RequestBody PmGiftChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmGiftService.changeStatus(id, req.getStatusCd())));
    }
    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmGift> rows) {
        switch (cmd) {
            case "base" -> boPmGiftService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /* ── 사은품 지급 조건 (gift-cond) 서브 API ─────────────────── */

    /** 상품에 연결된 사은품 조건 목록 조회 */
    @GetMapping("/gift-cond")
    public ResponseEntity<ApiResponse<List<PmGiftCondDto.Item>>> listGiftCond(
            @Valid @ModelAttribute PmGiftCondDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(pmGiftCondService.getList(req)));
    }

    /** 사은품 조건 등록 (상품을 사은품에 연결) */
    @PostMapping("/gift-cond")
    public ResponseEntity<ApiResponse<PmGiftCond>> createGiftCond(@RequestBody PmGiftCond entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(pmGiftCondService.create(entity)));
    }

    /** 사은품 조건 삭제 (상품을 사은품에서 제거) */
    @DeleteMapping("/gift-cond/{condId}")
    public ResponseEntity<ApiResponse<Void>> deleteGiftCond(@PathVariable("condId") String condId) {
        pmGiftCondService.delete(condId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}