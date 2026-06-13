package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmFaqService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO FAQ API — /api/bo/ec/cm/faq
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/faq")
@RequiredArgsConstructor
public class BoCmFaqController {
    private final BoCmFaqService boCmFaqService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmFaqDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boCmFaqService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmFaqDto.Item>>> list(@Valid @ModelAttribute CmFaqDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmFaqService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmFaqDto.PageResponse>> page(@Valid @ModelAttribute CmFaqDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmFaqService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmFaq>> create(@RequestBody CmFaq body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boCmFaqService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmFaq>> update(@PathVariable("id") String id, @RequestBody CmFaq body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmFaqService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<CmFaq>> upsert(@PathVariable("id") String id, @RequestBody CmFaq body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmFaqService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmFaqService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<CmFaq> rows) {
        switch (cmd) {
            case "base" -> boCmFaqService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
