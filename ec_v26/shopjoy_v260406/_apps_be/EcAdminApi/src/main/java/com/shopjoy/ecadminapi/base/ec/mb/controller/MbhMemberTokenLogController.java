package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbhMemberTokenLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-token-log")
@RequiredArgsConstructor
public class MbhMemberTokenLogController {

    private final MbhMemberTokenLogService service;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberTokenLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberTokenLogDto.Item>>> list(@Valid @ModelAttribute MbhMemberTokenLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbhMemberTokenLogDto.PageResponse>> page(@Valid @ModelAttribute MbhMemberTokenLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbhMemberTokenLog>> create(@RequestBody MbhMemberTokenLog entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberTokenLog>> save(@PathVariable("id") String id, @RequestBody MbhMemberTokenLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberTokenLog>> updateSelective(@PathVariable("id") String id, @RequestBody MbhMemberTokenLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbhMemberTokenLog> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
