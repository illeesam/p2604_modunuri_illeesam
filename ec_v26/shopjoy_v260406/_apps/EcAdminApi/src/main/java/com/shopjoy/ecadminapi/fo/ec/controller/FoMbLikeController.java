package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.fo.ec.service.FoMbLikeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 찜(Like) API — 현재 로그인 회원 전용
 * GET    /api/fo/ec/mb/like                               — 내 찜 목록
 * POST   /api/fo/ec/mb/like/{targetTypeCd}/{targetId}     — 찜 토글 (추가/취소)
 * DELETE /api/fo/ec/mb/like/{targetTypeCd}/{targetId}     — 찜 취소
 *
 * 인가: USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/mb/like")
@RequiredArgsConstructor
public class FoMbLikeController {

    private final FoMbLikeService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbLikeDto>>> myLikes(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String targetTypeCd) {
        List<MbLikeDto> result = service.getMyLikes(siteId, targetTypeCd);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{targetTypeCd}/{targetId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggle(
            @PathVariable String targetTypeCd,
            @PathVariable String targetId,
            @RequestParam(required = false) String siteId) {
        boolean liked = service.toggle(siteId, targetTypeCd, targetId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("liked", liked)));
    }

    @DeleteMapping("/{targetTypeCd}/{targetId}")
    public ResponseEntity<ApiResponse<Void>> unlike(
            @PathVariable String targetTypeCd,
            @PathVariable String targetId,
            @RequestParam(required = false) String siteId) {
        service.unlike(siteId, targetTypeCd, targetId);
        return ResponseEntity.ok(ApiResponse.ok(null, "찜이 취소되었습니다."));
    }
}
