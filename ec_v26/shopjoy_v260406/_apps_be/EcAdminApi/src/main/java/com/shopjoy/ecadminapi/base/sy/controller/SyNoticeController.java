package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.service.SyNoticeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/notice")
@RequiredArgsConstructor
public class SyNoticeController {

    private final SyNoticeService service;

    /* 공지사항 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNoticeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 공지사항 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyNoticeDto.Item>>> list(@Valid @ModelAttribute SyNoticeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 공지사항 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyNoticeDto.PageResponse>> page(@Valid @ModelAttribute SyNoticeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 공지사항 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyNotice>> create(@RequestBody SyNotice entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 공지사항 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNotice>> save(@PathVariable("id") String id, @RequestBody SyNotice entity) {
        entity.setNoticeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 공지사항 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNotice>> updateSelective(@PathVariable("id") String id, @RequestBody SyNotice entity) {
        entity.setNoticeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 공지사항 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 공지사항 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyNotice> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
