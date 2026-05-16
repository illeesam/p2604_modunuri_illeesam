package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmhPushLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/push-log")
@RequiredArgsConstructor
public class CmhPushLogController {

    private final CmhPushLogService service;

    /* 푸시 발송 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmhPushLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 푸시 발송 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmhPushLogDto.Item>>> list(@Valid @ModelAttribute CmhPushLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 푸시 발송 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmhPushLogDto.PageResponse>> page(@Valid @ModelAttribute CmhPushLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 푸시 발송 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmhPushLog>> create(@RequestBody CmhPushLog entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 푸시 발송 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmhPushLog>> save(@PathVariable("id") String id, @RequestBody CmhPushLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 푸시 발송 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmhPushLog>> updateSelective(@PathVariable("id") String id, @RequestBody CmhPushLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 푸시 발송 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 푸시 발송 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmhPushLog> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
