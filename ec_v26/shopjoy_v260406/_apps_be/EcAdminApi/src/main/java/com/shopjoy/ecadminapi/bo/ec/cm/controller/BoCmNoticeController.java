package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmNoticeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 공지사항 API — /api/bo/ec/cm/notice
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/notice")
@RequiredArgsConstructor
public class BoCmNoticeController {
    private final BoCmNoticeService boCmNoticeService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNoticeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boCmNoticeService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyNoticeDto.Item>>> list(@Valid @ModelAttribute SyNoticeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmNoticeService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyNoticeDto.PageResponse>> page(@Valid @ModelAttribute SyNoticeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmNoticeService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyNotice>> create(@RequestBody SyNotice body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boCmNoticeService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNotice>> update(@PathVariable("id") String id, @RequestBody SyNotice body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmNoticeService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNotice>> upsert(@PathVariable("id") String id, @RequestBody SyNotice body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmNoticeService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmNoticeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyNotice> rows) {
        boCmNoticeService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
