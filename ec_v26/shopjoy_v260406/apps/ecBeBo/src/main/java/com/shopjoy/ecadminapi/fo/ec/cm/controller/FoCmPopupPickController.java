package com.shopjoy.ecadminapi.fo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.service.CmPopupPickService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 공통 선택(Pick) 팝업 API — 사용자 화면(FO) 용.
 *
 * <p>BO 와 같은 {@code cm_popup} 메타·같은 서비스를 쓰되, <b>사용 시스템 범위가 다르다</b>.
 * 각 조회는 {@code cm_popup.sys_scope} 에 {@code ^FO^} 가 있는 팝업만 허용하므로
 * 사용자·권한·메뉴처럼 관리자 전용 팝업은 이 경로로 열 수 없다.</p>
 *
 * <ul>
 *   <li>{@code GET /api/fo/cm/cmPopupPick/{popupCode}/config} — 팝업 구성</li>
 *   <li>{@code GET /api/fo/cm/cmPopupPick/{popupCode}/page}   — 목록</li>
 *   <li>{@code GET /api/fo/cm/cmPopupPick/{popupCode}/tree}   — 트리</li>
 * </ul>
 * 정의 관리(CRUD)는 BO 에만 둔다.
 */
@RestController
@RequestMapping("/api/fo/cm/cmPopupPick")
@RequiredArgsConstructor
public class FoCmPopupPickController {

    /** 사용 시스템 구분 — 이 컨트롤러로 들어온 요청은 전부 FO */
    private static final String SYS = "FO";

    private final CmPopupPickService cmPopupPickService;

    @GetMapping("/{popupCode}/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> config(
            @PathVariable("popupCode") String popupCode,
            @RequestParam(required = false) String siteId) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getConfig(popupCode, siteId, SYS)));
    }

    @GetMapping("/{popupCode}/page")
    public ResponseEntity<ApiResponse<PageResult<Map<String, Object>>>> page(
            @PathVariable("popupCode") String popupCode,
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getPage(popupCode, p, SYS)));
    }

    @GetMapping("/{popupCode}/tree")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> tree(
            @PathVariable("popupCode") String popupCode,
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getTree(popupCode, p, SYS)));
    }
}
