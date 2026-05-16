package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmChattService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 채팅 API — /api/bo/ec/cm/chatt
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/chatt")
@RequiredArgsConstructor
public class BoCmChattController {
    private final BoCmChattService boCmChattService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattRoomDto.Item>>> list(@Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmChattRoomDto.PageResponse>> page(@Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmChattRoom>> create(@RequestBody CmChattRoom body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boCmChattService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoom>> update(@PathVariable("id") String id, @RequestBody CmChattRoom body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoom>> upsert(@PathVariable("id") String id, @RequestBody CmChattRoom body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmChattService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CmChattRoomDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody CmChattChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.changeStatus(id, req.getStatusCd())));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmChattRoom> rows) {
        boCmChattService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
