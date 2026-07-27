package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardMenu;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardMenuRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardItemDataService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardItemService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardService;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bo/ec/cm/dashboard")
@RequiredArgsConstructor
public class BoCmDashboardController {

    private final CmDashboardService cmDashboardService;
    private final CmDashboardItemService cmDashboardItemService;
    private final CmDashboardItemDataService cmDashboardItemDataService;
    private final CmDashboardRepository cmDashboardRepository;
    private final CmDashboardMenuRepository cmDashboardMenuRepository;

    /* ── 차트 데이터셋 ────────────────────────────────────────── */

    @PostMapping("/data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> data(
            @RequestBody List<Map<String, Object>> items) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardService.getDashboard(items)));
    }

    /** 일별 현황 집계 — SyStatsAggregationJob 과 동일한 쿼리를 온디맨드 실행. */
    @GetMapping("/daily-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dailyStats(
            @RequestParam(required = false) String targetDate) {
        LocalDate date = targetDate != null && !targetDate.isBlank()
            ? LocalDate.parse(targetDate)
            : null;
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardService.getDailyStats(date)));
    }

    /* ── cm_dashboard CRUD ─────────────────────────────────────── */

    /**
     * 대시보드 목록.
     *
     * @param scope 접근범위 필터 (선택)
     *              - "accessible" : 현재 사용자가 볼 수 있는 것만 (공용 + 내 것 + 나에게 공유된 것)
     *              - "mine"       : 내가 소유한 개인 대시보드만
     *              - "shared"     : 나에게 공유된(내 소유 아닌) 개인 대시보드만
     *              - 미지정        : 전체 (기준관리 화면용)
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<CmDashboard>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String useYn,
            @RequestParam(required = false) String scope) {
        List<CmDashboard> result;
        if (siteId != null && useYn != null) {
            result = cmDashboardRepository.findBySiteIdAndUseYnOrderBySortOrdAsc(siteId, useYn);
        } else if (siteId != null) {
            result = cmDashboardRepository.findBySiteIdOrderBySortOrdAsc(siteId);
        } else {
            result = cmDashboardRepository.findAll();
        }
        if (scope != null && !scope.isBlank()) {
            AuthPrincipal me = SecurityUtil.getAuthUser();
            result = result.stream().filter(d -> switch (scope) {
                case "mine"   -> isOwner(d, me);
                case "shared" -> !isOwner(d, me) && isPersonal(d) && isVisibleTo(d, me);
                default       -> isVisibleTo(d, me); /* accessible */
            }).toList();
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 공유범위 판정 ─────────────────────────────────────────── */

    private boolean isPersonal(CmDashboard d) {
        return d.getOwnerUserId() != null && !d.getOwnerUserId().isBlank();
    }

    private boolean isOwner(CmDashboard d, AuthPrincipal me) {
        return isPersonal(d) && d.getOwnerUserId().equals(me.authId());
    }

    /**
     * 현재 사용자에게 이 대시보드가 보이는지 판정.
     * 공용(owner 없음)은 항상 노출. 개인 대시보드는 공개여부 + 공유대상으로 판정한다.
     *
     * <p>share_scope_cd = 공개여부
     *   PUBLIC : 전체 공개
     *   PRIVATE(기본) : 소유자 + 공유대상(부서/사용자)만. 대상이 없으면 소유자만(=나만 보기).
     * <p>공유대상은 부서(share_dept_id)와 사용자(share_user_ids)를 각각 ^구분 다중 저장하며 OR 로 판정.
     * <p>레거시 호환: ME→PRIVATE(대상 없음), ALL→PUBLIC, DEPT/USER→PRIVATE(각 대상 보유)
     */
    private boolean isVisibleTo(CmDashboard d, AuthPrincipal me) {
        if (!isPersonal(d)) return true;          /* 공용 */
        if (isOwner(d, me)) return true;          /* 내 것 — 항상 접근 */
        String scopeCd = d.getShareScopeCd() == null || d.getShareScopeCd().isBlank()
            ? "PRIVATE" : d.getShareScopeCd();
        if ("PUBLIC".equals(scopeCd) || "ALL".equals(scopeCd)) return true;
        if ("ME".equals(scopeCd)) return false;   /* 레거시: 나만 */
        /* PRIVATE (+ 레거시 DEPT/USER): 공유대상 포함 여부 (부서 OR 사용자) */
        return containsToken(d.getShareDeptId(), me.deptId())
            || containsToken(d.getShareUserIds(), me.authId());
    }

    /** ^구분 다중값(^A^B^) 또는 단일값에 target 이 포함되는지 */
    private boolean containsToken(String stored, String target) {
        if (stored == null || stored.isBlank() || target == null || target.isBlank()) return false;
        if (stored.contains("^")) return stored.contains("^" + target + "^");
        return stored.equals(target);             /* 레거시 단일 deptId */
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmDashboard>> getById(@PathVariable("id") String id) {
        CmDashboard entity = cmDashboardRepository.findById(id)
            .orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않습니다: " + id));
        return ResponseEntity.ok(ApiResponse.ok(entity));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmDashboard>> create(@RequestBody CmDashboard body) {
        String authId = SecurityUtil.getAuthUser().authId();
        body.setDashboardId(CmUtil.generateId("cm_dashboard"));
        body.setRegBy(authId); body.setRegDate(LocalDateTime.now());
        body.setUpdBy(authId); body.setUpdDate(LocalDateTime.now());
        if (body.getUseYn() == null) body.setUseYn("Y");
        return ResponseEntity.status(201).body(ApiResponse.created(cmDashboardRepository.save(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmDashboard>> update(
            @PathVariable("id") String id, @RequestBody CmDashboard body) {
        CmDashboard entity = cmDashboardRepository.findById(id)
            .orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않습니다: " + id));
        checkOwner(entity);
        if (body.getDashboardNm() != null) entity.setDashboardNm(body.getDashboardNm());
        if (body.getUiCompNm() != null)    entity.setUiCompNm(body.getUiCompNm());
        if (body.getLayoutCols() != null)  entity.setLayoutCols(body.getLayoutCols());
        if (body.getSortOrd() != null)     entity.setSortOrd(body.getSortOrd());
        if (body.getUseYn() != null)       entity.setUseYn(body.getUseYn());
        if (body.getOwnerUserId() != null) entity.setOwnerUserId(body.getOwnerUserId().isBlank() ? null : body.getOwnerUserId());
        if (body.getShareScopeCd() != null) entity.setShareScopeCd(body.getShareScopeCd().isBlank() ? null : body.getShareScopeCd());
        if (body.getShareDeptId() != null)  entity.setShareDeptId(body.getShareDeptId().isBlank() ? null : body.getShareDeptId());
        if (body.getShareUserIds() != null) entity.setShareUserIds(body.getShareUserIds().isBlank() ? null : body.getShareUserIds());
        if (body.getRemark() != null)      entity.setRemark(body.getRemark());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardRepository.save(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        cmDashboardRepository.findById(id).ifPresent(this::checkOwner);
        cmDashboardRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** 개인화(owner_user_id 지정) 대시보드는 소유자 본인만 수정/삭제 가능 */
    private void checkOwner(CmDashboard entity) {
        String owner = entity.getOwnerUserId();
        if (owner == null || owner.isBlank()) return; /* 공용 대시보드 */
        String authId = SecurityUtil.getAuthUser().authId();
        if (!owner.equals(authId))
            throw new com.shopjoy.ecadminapi.common.exception.CmBizException(
                "본인 소유의 개인화 대시보드만 수정/삭제할 수 있습니다. (소유자: " + owner + ")");
    }

    /* ── 패널 정의 (CmDashboardItem) ──────────────────────────── */

    @GetMapping("/item/list")
    public ResponseEntity<ApiResponse<List<CmDashboardItem>>> itemList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getList(p)));
    }

    @GetMapping("/item/{id}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemGetById(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getById(id)));
    }

    @PostMapping("/item/save/{cmd}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemSave(
            @PathVariable("cmd") String cmd,
            @RequestBody CmDashboardItem body) {
        validateSrcItemRef(body);
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.save(cmd, body)));
    }

    @PostMapping("/item/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> itemSaveList(
            @PathVariable("cmd") String cmd,
            @RequestBody List<CmDashboardItem> rows) {
        rows.forEach(this::validateSrcItemRef);
        cmDashboardItemService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** optionJson._srcItemId(개인화 위젯의 원본 패널 참조) 무결성 검증 — 존재하지 않는 원본이면 저장 차단 */
    private void validateSrcItemRef(CmDashboardItem body) {
        if ("D".equals(body.getRowStatus())) return; /* 삭제 행은 검증 불필요 */
        String json = body.getOptionJson();
        if (json == null || !json.contains("_srcItemId")) return;
        try {
            com.fasterxml.jackson.databind.JsonNode node =
                new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
            com.fasterxml.jackson.databind.JsonNode src = node.get("_srcItemId");
            if (src != null && src.isTextual() && !src.asText().isBlank()) {
                cmDashboardItemService.getById(src.asText()); /* 미존재 시 CmBizException */
            }
        } catch (com.fasterxml.jackson.core.JacksonException e) {
            throw new com.shopjoy.ecadminapi.common.exception.CmBizException(
                "optionJson 형식이 올바르지 않습니다: " + e.getOriginalMessage());
        }
    }

    /* ── 집계 데이터 (CmDashboardItemData) ───────────────────── */

    @GetMapping("/item-data/list")
    public ResponseEntity<ApiResponse<List<CmDashboardItemData>>> itemDataList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemDataService.getList(p)));
    }

    @PostMapping("/item-data/upsert")
    public ResponseEntity<ApiResponse<CmDashboardItemData>> itemDataUpsert(
            @RequestBody CmDashboardItemData body) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemDataService.upsert(body)));
    }
    /* ── 좌측메뉴 트리 (사용자별) ──────────────────────────────
     * 폴더 + 대시보드 아이템으로 구성. 노드가 하나도 없으면 프론트가
     * "볼 수 있는 대시보드 전체" 로 폴백한다. */

    @GetMapping("/menu/tree")
    public ResponseEntity<ApiResponse<List<CmDashboardMenu>>> menuTree(
            @RequestParam(required = false) String siteId) {
        String sid = siteId == null ? SecurityUtil.getSiteId() : siteId;
        String uid = SecurityUtil.getAuthUser().authId();
        return ResponseEntity.ok(ApiResponse.ok(
            cmDashboardMenuRepository.findBySiteIdAndOwnerUserIdOrderBySortOrdAsc(sid, uid)));
    }

    /**
     * 트리 통째 저장 — 내 노드를 전부 지우고 받은 목록으로 다시 넣는다.
     *
     * <p>부분 갱신보다 단순하고 순서·부모가 한 번에 정합하게 맞는다.
     * 소유자는 서버가 세션에서 채우므로 남의 트리를 건드릴 수 없다.</p>
     */
    @PostMapping("/menu/save")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Integer>> menuSave(
            @RequestParam(required = false) String siteId,
            @RequestBody List<CmDashboardMenu> nodes) {
        String sid = siteId == null ? SecurityUtil.getSiteId() : siteId;
        String uid = SecurityUtil.getAuthUser().authId();
        cmDashboardMenuRepository.deleteBySiteIdAndOwnerUserId(sid, uid);
        cmDashboardMenuRepository.flush();
        LocalDateTime now = LocalDateTime.now();
        /* 클라이언트는 임시 키로 부모를 가리킨다. 실제 ID 를 새로 만들면서 키→ID 로 바꿔준다
           (그냥 재생성만 하면 parentNodeId 가 끊어진 키를 가리켜 트리가 무너진다). */
        java.util.Map<String, String> keyToId = new java.util.LinkedHashMap<>();
        for (CmDashboardMenu n : nodes) {
            keyToId.put(n.getMenuNodeId(), CmUtil.generateId("cm_dashboard_menu"));
        }
        int i = 0;
        for (CmDashboardMenu n : nodes) {
            String pk = n.getParentNodeId();
            n.setParentNodeId(pk == null || pk.isBlank() ? null : keyToId.get(pk));
            n.setMenuNodeId(keyToId.get(n.getMenuNodeId()));
            n.setSiteId(sid);
            n.setOwnerUserId(uid);            /* 소유자는 세션 고정 — 클라이언트 값 무시 */
            n.setSortOrd(++i * 10);
            if (n.getUseYn() == null) n.setUseYn("Y");
            n.setRegBy(uid); n.setRegDate(now);
            n.setUpdBy(uid); n.setUpdDate(now);
        }
        cmDashboardMenuRepository.saveAll(nodes);
        return ResponseEntity.ok(ApiResponse.ok(nodes.size(), "저장되었습니다."));
    }

}
