package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmChattService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 채팅 API
 * GET    /api/bo/ec/cm/chatt       — 목록
 * GET    /api/bo/ec/cm/chatt/page  — 페이징
 * GET    /api/bo/ec/cm/chatt/{id}  — 단건
 * POST   /api/bo/ec/cm/chatt       — 등록
 * PUT    /api/bo/ec/cm/chatt/{id}  — 수정
 * DELETE /api/bo/ec/cm/chatt/{id}  — 삭제
 * PATCH  /api/bo/ec/cm/chatt/{id}/status — 상태변경
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/chatt")
@RequiredArgsConstructor
public class BoCmChattController {
    private final BoCmChattService boCmChattService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattRoomDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<CmChattRoomDto> result = boCmChattService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<CmChattRoomDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<CmChattRoomDto> result = boCmChattService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> getById(@PathVariable("id") String id) {
        CmChattRoomDto result = boCmChattService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmChattRoom>> create(@RequestBody CmChattRoom body) {
        CmChattRoom result = boCmChattService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> update(@PathVariable("id") String id, @RequestBody CmChattRoom body) {
        CmChattRoomDto result = boCmChattService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> upsert(@PathVariable("id") String id, @RequestBody CmChattRoom body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmChattService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** changeStatus */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CmChattRoomDto>> changeStatus(
            @PathVariable("id") String id, @RequestBody Map<String, String> body) {
        CmChattRoomDto result = boCmChattService.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmChattRoom> rows) {
        boCmChattService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}