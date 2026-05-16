package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbhMemberLoginLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-login-log")
@RequiredArgsConstructor
public class MbhMemberLoginLogController {

    private final MbhMemberLoginLogService service;

    /* 회원 로그인 로그 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberLoginLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 회원 로그인 로그 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberLoginLogDto.Item>>> list(@Valid @ModelAttribute MbhMemberLoginLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 회원 로그인 로그 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbhMemberLoginLogDto.PageResponse>> page(@Valid @ModelAttribute MbhMemberLoginLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 회원 로그인 로그 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbhMemberLoginLog>> create(@RequestBody MbhMemberLoginLog entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 회원 로그인 로그 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberLoginLog>> save(@PathVariable("id") String id, @RequestBody MbhMemberLoginLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 회원 로그인 로그 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberLoginLog>> updateSelective(@PathVariable("id") String id, @RequestBody MbhMemberLoginLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 회원 로그인 로그 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 회원 로그인 로그 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbhMemberLoginLog> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
