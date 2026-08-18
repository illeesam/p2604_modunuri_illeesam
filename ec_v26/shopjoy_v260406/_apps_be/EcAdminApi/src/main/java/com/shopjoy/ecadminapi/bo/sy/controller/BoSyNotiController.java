package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNoti;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyNotiService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 알림함 API — /api/bo/sy/noti
 * 상단 종 아이콘(내 알림) + 시뮬레이션 발송 + 관리자 전체조회. 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/noti")
@RequiredArgsConstructor
public class BoSyNotiController {

    private final BoSyNotiService boSyNotiService;

    /* ── 내 알림함 (상단 종) ─────────────────────────────────── */

    /** 내 알림 목록 — 종 드롭다운(상위 N건) */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<SyNotiDto.Item>>> myList(@Valid @ModelAttribute SyNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.getMyList(req)));
    }

    /** 내 알림 페이지 — 알림함 전체보기 */
    @GetMapping("/my/page")
    public ResponseEntity<ApiResponse<BasePage<SyNotiDto.Item>>> myPage(@Valid @ModelAttribute SyNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.getMyPageData(req)));
    }

    /** 내 안읽음 건수 — 종 뱃지 */
    @GetMapping("/my/unread-count")
    public ResponseEntity<ApiResponse<Long>> myUnreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.getMyUnreadCount()));
    }

    /** 읽음/안읽음 토글 — body: { readYn: 'Y'|'N' } */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<SyNoti>> markRead(@PathVariable("id") String id,
                                                       @RequestBody(required = false) Map<String, Object> body) {
        String readYn = body == null ? "Y" : String.valueOf(body.getOrDefault("readYn", "Y"));
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.markRead(id, readYn)));
    }

    /** 모두읽음 */
    @PostMapping("/my/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllRead() {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.markAllRead(), "모두 읽음 처리되었습니다."));
    }

    /** 내 알림 전체삭제 */
    @DeleteMapping("/my/all")
    public ResponseEntity<ApiResponse<Integer>> deleteMyAll() {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.deleteMyAll(), "삭제되었습니다."));
    }

    /* ── 발송 / 관리 ────────────────────────────────────────── */

    /** 발송 — 수신자(회원/사용자) 여러 명에게 같은 알림 적재 */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Integer>> send(@Valid @RequestBody SyNotiDto.SendReq req) {
        List<SyNoti> rows = boSyNotiService.send(req);
        return ResponseEntity.status(201).body(ApiResponse.created(rows.size()));
    }

    /** page — 전체 알림 조회 (관리자) */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyNotiDto.Item>>> page(@Valid @ModelAttribute SyNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyNotiDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyNotiService.getById(id)));
    }

    /** create — 단건 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyNoti>> create(@Valid @RequestBody SyNoti body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyNotiService.create(body)));
    }

    /** delete — 내 알림 1건 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyNotiService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
