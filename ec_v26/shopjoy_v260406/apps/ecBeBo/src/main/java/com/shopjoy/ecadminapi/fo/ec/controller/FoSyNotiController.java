package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNoti;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoSyNotiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 알림함 API — /api/fo/my/noti
 * 로그인 회원 본인에게 온 알림만 조회/읽음/삭제. 수신자 조건은 서버에서 주입한다.
 */
@RestController
@RequestMapping("/api/fo/my/noti")
@RequiredArgsConstructor
public class FoSyNotiController {

    private final FoSyNotiService foSyNotiService;

    /** 내 알림 목록 — 종 드롭다운(상위 N건) */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<SyNotiDto.Item>>> list(@Valid @ModelAttribute SyNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foSyNotiService.getMyList(req)));
    }

    /** 내 알림 페이지 — 알림함 전체보기 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyNotiDto.Item>>> page(@Valid @ModelAttribute SyNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foSyNotiService.getMyPageData(req)));
    }

    /** 내 안읽음 건수 — 종 뱃지 */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(foSyNotiService.getMyUnreadCount()));
    }

    /** 읽음/안읽음 토글 — body: { readYn: 'Y'|'N' } */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<SyNoti>> markRead(@PathVariable("id") String id,
                                                       @RequestBody(required = false) Map<String, Object> body) {
        String readYn = body == null ? "Y" : String.valueOf(body.getOrDefault("readYn", "Y"));
        return ResponseEntity.ok(ApiResponse.ok(foSyNotiService.markRead(id, readYn)));
    }

    /** 모두읽음 */
    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllRead() {
        return ResponseEntity.ok(ApiResponse.ok(foSyNotiService.markAllRead(), "모두 읽음 처리되었습니다."));
    }

    /** 1건 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        foSyNotiService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** 전체삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Integer>> deleteAll() {
        return ResponseEntity.ok(ApiResponse.ok(foSyNotiService.deleteMyAll(), "삭제되었습니다."));
    }
}
