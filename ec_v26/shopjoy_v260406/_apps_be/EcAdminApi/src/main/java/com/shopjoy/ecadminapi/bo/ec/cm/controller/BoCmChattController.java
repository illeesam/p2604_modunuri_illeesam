package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattChangeStatusDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMemberDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmChattService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 채팅 API — /api/bo/ec/cm/chatt
 */
@RestController
@RequestMapping("/api/bo/ec/cm/chatt")
@RequiredArgsConstructor
public class BoCmChattController {

    private final BoCmChattService boCmChattService;

    /* ── 채팅방 ──────────────────────────────────────────────── */

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattDto.Item>>> list(@Valid @ModelAttribute CmChattDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmChattDto.PageResponse>> page(@Valid @ModelAttribute CmChattDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmChatt>> create(@RequestBody CmChatt body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boCmChattService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChatt>> update(@PathVariable("id") String id, @RequestBody CmChatt body) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boCmChattService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CmChattDto.Item>> changeStatus(
            @PathVariable("id") String id, @RequestBody CmChattChangeStatusDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.changeStatus(id, req.getStatusCd())));
    }

    /* ── 메시지 ──────────────────────────────────────────────── */

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<CmChattMsgDto.Item>>> getMessages(
            @PathVariable("id") String id,
            @RequestParam(value = "afterMsgId", required = false) String afterMsgId) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getMessages(id, afterMsgId)));
    }

    @PostMapping("/{id}/msg")
    public ResponseEntity<ApiResponse<CmChattMsg>> sendMsg(
            @PathVariable("id") String id, @RequestBody CmChattMsgDto.SendRequest body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boCmChattService.sendMsg(id, body)));
    }

    /* ── 참여자 ──────────────────────────────────────────────── */

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<CmChattMemberDto.Item>>> getMembers(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boCmChattService.getMembers(id)));
    }
}
