package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdRestockNotiService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 재입고알림 API — /api/bo/ec/pd/restock-noti
 */
@RestController
@RequestMapping("/api/bo/ec/pd/restock-noti")
@RequiredArgsConstructor
public class BoPdRestockNotiController {
    private final BoPdRestockNotiService boPdRestockNotiService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdRestockNotiDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boPdRestockNotiService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdRestockNotiDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boPdRestockNotiService.getPageData(p)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNotiDto>> getById(@PathVariable("id") String id) {
        PdRestockNotiDto result = boPdRestockNotiService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdRestockNoti>> create(@RequestBody PdRestockNoti body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boPdRestockNotiService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNotiDto>> update(@PathVariable("id") String id, @RequestBody PdRestockNoti body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdRestockNotiService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNotiDto>> upsert(@PathVariable("id") String id, @RequestBody PdRestockNoti body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdRestockNotiService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdRestockNotiService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** send — 전송 */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Void>> send(@RequestBody Map<String, Object> body) {
        boPdRestockNotiService.send(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "발송되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdRestockNoti> rows) {
        boPdRestockNotiService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}