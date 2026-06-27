package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmChattService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 채팅 API — /api/fo/my/chat
 * 인가: FO 로그인 회원 전용
 */
@RestController
@RequestMapping("/api/fo/my/chat")
@RequiredArgsConstructor
public class FoCmChattController {

    private final FoCmChattService foCmChattService;

    /** 내 채팅방 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattDto.Item>>> myList(
            @RequestParam(value = "siteId", required = false) String siteId) {
        return ResponseEntity.ok(ApiResponse.ok(foCmChattService.getMyChattList(siteId)));
    }

    /** 채팅방 열기 (기존 열린 방 반환 또는 신규 생성) */
    @PostMapping("/open")
    public ResponseEntity<ApiResponse<CmChattDto.Item>> openChatt(@RequestBody Map<String, String> body) {
        String siteId = body.get("siteId");
        String subject = body.get("subject");
        return ResponseEntity.ok(ApiResponse.ok(foCmChattService.openChatt(siteId, subject)));
    }

    /** 채팅방 단건 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foCmChattService.getMyChatt(id)));
    }

    /** 메시지 목록 (폴링) */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<CmChattMsgDto.Item>>> getMessages(
            @PathVariable("id") String id,
            @RequestParam(value = "afterMsgId", required = false) String afterMsgId) {
        return ResponseEntity.ok(ApiResponse.ok(foCmChattService.getMessages(id, afterMsgId)));
    }

    /** 메시지 전송 */
    @PostMapping("/{id}/msg")
    public ResponseEntity<ApiResponse<CmChattMsg>> sendMsg(
            @PathVariable("id") String id, @RequestBody CmChattMsgDto.SendRequest body) {
        return ResponseEntity.status(201).body(ApiResponse.created(foCmChattService.sendMsg(id, body)));
    }
}
