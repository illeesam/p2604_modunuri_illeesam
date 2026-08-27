package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPopupDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupItemRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmPopupPickService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ModelAttribute;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 공통 선택(Pick) 팝업 API — cm_popup / cm_popup_item 메타 기반.
 *
 * <p>BO 전 화면의 선택 팝업이 이 컨트롤러 하나를 사용한다. 타입별 컨트롤러가 필요 없다.
 * <ul>
 *   <li>{@code GET /api/bo/cm/cmPopupPick/{popupCode}/config} — 팝업 구성(조회항목·목록컬럼·패턴)</li>
 *   <li>{@code GET /api/bo/cm/cmPopupPick/{popupCode}/page}   — 목록 (검색·페이징)</li>
 *   <li>{@code GET /api/bo/cm/cmPopupPick/{popupCode}/tree}   — 트리 (패턴 2·3)</li>
 * </ul>
 * 팝업 정의 관리(CRUD)는 {@code /api/bo/cm/cmPopupPick/popup/**} 로 제공한다.
 */
@RestController
@RequestMapping("/api/bo/cm/cmPopupPick")
@RequiredArgsConstructor
public class BoCmPopupPickController {

    private final CmPopupPickService cmPopupPickService;
    private final CmPopupRepository cmPopupRepository;
    private final CmPopupItemRepository cmPopupItemRepository;

    /* ── 팝업 사용 (조회 전용) ─────────────────────────────────── */

    @GetMapping("/{popupCode}/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> config(
            @PathVariable("popupCode") String popupCode,
            @RequestParam(required = false) String siteId) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getConfig(popupCode, siteId)));
    }

    @GetMapping("/{popupCode}/page")
    public ResponseEntity<ApiResponse<PageResult<Map<String, Object>>>> page(
            @PathVariable("popupCode") String popupCode,
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getPage(popupCode, p)));
    }

    @GetMapping("/{popupCode}/tree")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> tree(
            @PathVariable("popupCode") String popupCode,
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getTree(popupCode, p)));
    }

    /* ── 팝업 정의 관리 ────────────────────────────────────────── */

    @GetMapping("/popup/list")
    public ResponseEntity<ApiResponse<List<CmPopup>>> popupList(
            @RequestParam(required = false) String siteId) {
        List<CmPopup> list = cmPopupRepository.findByUseYnOrderBySortOrdAsc("Y");
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/popup/page")
    public ResponseEntity<ApiResponse<BasePage<CmPopup>>> popupPage(
            @Valid @ModelAttribute CmPopupDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getPopupPage(req)));
    }

    @GetMapping("/popup/{popupId}/items")
    public ResponseEntity<ApiResponse<List<CmPopupItem>>> popupItems(
            @PathVariable("popupId") String popupId) {
        return ResponseEntity.ok(ApiResponse.ok(cmPopupPickService.getPopupItems(popupId)));
    }

    @PostMapping("/popup")
    public ResponseEntity<ApiResponse<CmPopup>> popupCreate(@Valid @RequestBody CmPopup body) {
        String authId = SecurityUtil.getAuthUser().authId();
        body.setPopupId(CmUtil.generateId("cm_popup"));
        body.setRegBy(authId); body.setRegDate(LocalDateTime.now());
        body.setUpdBy(authId); body.setUpdDate(LocalDateTime.now());
        if (body.getUseYn() == null) body.setUseYn("Y");
        return ResponseEntity.status(201).body(ApiResponse.created(cmPopupRepository.save(body)));
    }

    @PutMapping("/popup/{popupId}")
    public ResponseEntity<ApiResponse<CmPopup>> popupUpdate(
            @PathVariable("popupId") String popupId, @Valid @RequestBody CmPopup body) {
        CmPopup e = cmPopupRepository.findById(popupId)
            .orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않습니다: " + popupId));
        if (body.getPopupNm() != null)      e.setPopupNm(body.getPopupNm());
        if (body.getPopupPattern() != null) e.setPopupPattern(body.getPopupPattern());
        if (body.getEntityNm() != null)     e.setEntityNm(body.getEntityNm());
        if (body.getIdField() != null)      e.setIdField(body.getIdField());
        if (body.getNmField() != null)      e.setNmField(body.getNmField());
        if (body.getParentField() != null)  e.setParentField(body.getParentField().isBlank() ? null : body.getParentField());
        if (body.getTreeEntityNm() != null) e.setTreeEntityNm(body.getTreeEntityNm().isBlank() ? null : body.getTreeEntityNm());
        if (body.getTreeIdField() != null)  e.setTreeIdField(body.getTreeIdField().isBlank() ? null : body.getTreeIdField());
        if (body.getTreeNmField() != null)  e.setTreeNmField(body.getTreeNmField().isBlank() ? null : body.getTreeNmField());
        if (body.getTreeLinkField() != null) e.setTreeLinkField(body.getTreeLinkField().isBlank() ? null : body.getTreeLinkField());
        if (body.getSiteField() != null)    e.setSiteField(body.getSiteField().isBlank() ? null : body.getSiteField());
        if (body.getJoinClause() != null)    e.setJoinClause(body.getJoinClause().isBlank() ? null : body.getJoinClause());
        if (body.getOrderBy() != null)      e.setOrderBy(body.getOrderBy());
        if (body.getBaseWhere() != null)    e.setBaseWhere(body.getBaseWhere().isBlank() ? null : body.getBaseWhere());
        if (body.getMultiYn() != null)      e.setMultiYn(body.getMultiYn());
        if (body.getSysScope() != null)     e.setSysScope(body.getSysScope());
        if (body.getPagingYn() != null)     e.setPagingYn(body.getPagingYn());
        if (body.getPageSize() != null)     e.setPageSize(body.getPageSize());
        if (body.getModalWidth() != null)   e.setModalWidth(body.getModalWidth());
        if (body.getUseYn() != null)        e.setUseYn(body.getUseYn());
        if (body.getSortOrd() != null)      e.setSortOrd(body.getSortOrd());
        if (body.getApplyUiMemo() != null)  e.setApplyUiMemo(body.getApplyUiMemo());
        if (body.getRemark() != null)       e.setRemark(body.getRemark());
        e.setUpdBy(SecurityUtil.getAuthUser().authId());
        e.setUpdDate(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.ok(cmPopupRepository.save(e)));
    }

    @DeleteMapping("/popup/{popupId}")
    public ResponseEntity<ApiResponse<Void>> popupDelete(@PathVariable("popupId") String popupId) {
        cmPopupItemRepository.findByPopupIdAndUseYnOrderBySortOrdAsc(popupId, "Y")
            .forEach(i -> cmPopupItemRepository.deleteById(i.getPopupItemId()));
        cmPopupRepository.deleteById(popupId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* ── 팝업 항목 관리 ────────────────────────────────────────── */

    @PostMapping("/popup/item")
    public ResponseEntity<ApiResponse<CmPopupItem>> itemSave(@Valid @RequestBody CmPopupItem body) {
        /* 세션 자동값 검증 — 허용 속성만, 그리고 반드시 필수여야 한다.
           세션값인데 필수가 아니면 미로그인 시 조건이 조용히 빠져 전체 데이터가 노출된다. */
        String sv = body.getSessionCondField();
        if (sv != null && !sv.isBlank()) {
            if (!CmPopupPickService.SESSION_ATTRS.contains(sv.trim())) {
                throw new CmBizException("허용되지 않는 세션값입니다: " + sv
                    + " — 허용: " + String.join(", ", CmPopupPickService.SESSION_ATTRS));
            }
            body.setRequiredYn("Y");
        }
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        if (body.getPopupItemId() == null || body.getPopupItemId().isBlank()) {
            body.setPopupItemId(CmUtil.generateId("cm_popup_item"));
            body.setRegBy(authId); body.setRegDate(now);
        }
        body.setUpdBy(authId); body.setUpdDate(now);
        if (body.getUseYn() == null) body.setUseYn("Y");
        return ResponseEntity.ok(ApiResponse.ok(cmPopupItemRepository.save(body)));
    }

    @DeleteMapping("/popup/item/{popupItemId}")
    public ResponseEntity<ApiResponse<Void>> itemDelete(@PathVariable("popupItemId") String popupItemId) {
        cmPopupItemRepository.deleteById(popupItemId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
