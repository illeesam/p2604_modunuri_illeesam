package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoMbLikeService;
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

    private final FoMbLikeService foMbLikeService;

    /** myLikes */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbLikeDto.Item>>> myLikes(@jakarta.validation.Valid @ModelAttribute MbLikeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMbLikeService.getMyLikes(req)));
    }

    /** toggle — 전환 */
    @PostMapping("/{targetTypeCd}/{targetId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggle(
            @PathVariable("targetTypeCd") String targetTypeCd,
            @PathVariable("targetId") String targetId,
            @RequestParam(value = "siteId", required = false) String siteId) {
        boolean liked = foMbLikeService.toggle(targetTypeCd, targetId, siteId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("liked", liked)));
    }

    /** unlike */
    @DeleteMapping("/{targetTypeCd}/{targetId}")
    public ResponseEntity<ApiResponse<Void>> unlike(
            @PathVariable("targetTypeCd") String targetTypeCd,
            @PathVariable("targetId") String targetId) {
        foMbLikeService.unlike(targetTypeCd, targetId);
        return ResponseEntity.ok(ApiResponse.ok(null, "찜이 취소되었습니다."));
    }
}
