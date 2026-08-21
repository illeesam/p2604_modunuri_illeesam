package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardWidgetRow;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardMenu;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardMenuRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardDataGridService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardDataService;
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

import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
@RestController
@RequestMapping("/api/bo/ec/cm/dashboard")
@RequiredArgsConstructor
public class BoCmDashboardController {

    private final CmDashboardService cmDashboardService;
    private final CmDashboardItemService cmDashboardItemService;
    private final CmDashboardDataService cmDashboardDataService;
    private final CmDashboardDataGridService cmDashboardDataGridService;
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
        if (useYn != null) {
            result = cmDashboardRepository.findByUseYnOrderBySortOrdAsc(useYn);
        } else {
            result = cmDashboardRepository.findAllByOrderBySortOrdAsc();
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
     *   PRIVATE(기본) : 소유자 + 공유대상(부서/사용자/업체)만. 대상이 없으면 소유자만(=나만 보기).
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
        /* PRIVATE (+ 레거시 DEPT/USER): 공유대상 포함 여부 (부서 OR 사용자 OR 업체) */
        return containsToken(d.getShareDeptId(), me.deptId())
            || containsToken(d.getShareUserIds(), me.authId())
            || containsToken(d.getShareVendorIds(), me.vendorId());
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
    public ResponseEntity<ApiResponse<CmDashboard>> create(@Valid @RequestBody CmDashboard body) {
        String authId = SecurityUtil.getAuthUser().authId();
        body.setDashboardId(CmUtil.generateId("cm_dashboard"));
        body.setRegBy(authId); body.setRegDate(LocalDateTime.now());
        body.setUpdBy(authId); body.setUpdDate(LocalDateTime.now());
        if (body.getUseYn() == null) body.setUseYn("Y");
        return ResponseEntity.status(201).body(ApiResponse.created(cmDashboardRepository.save(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmDashboard>> update(
            @PathVariable("id") String id, @Valid @RequestBody CmDashboard body) {
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
        if (body.getShareVendorIds() != null) entity.setShareVendorIds(body.getShareVendorIds().isBlank() ? null : body.getShareVendorIds());
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

    /**
     * 항목 목록 — <b>기본은 차트(key_level=1)만</b> 돌려준다.
     *
     * <p>3레벨 전개(2026-08-21) 이후 이 테이블에는 시리즈·항목 행까지 들어 있어서,
     * 필터 없이 주면 배치·카탈로그 화면에 '11번가' 같은 3레벨 행이 카드로 뜬다.
     * 전체가 필요하면 {@code keyLevel=0} (또는 원하는 레벨 번호)을 명시한다.</p>
     */
    @GetMapping("/item/list")
    public ResponseEntity<ApiResponse<List<CmDashboardItem>>> itemList(
            @RequestParam Map<String, Object> p) {
        Object lv = p.get("keyLevel");
        int level = 1;                                   /* 미지정이면 차트만 */
        if (lv != null && !String.valueOf(lv).isBlank()) {
            try { level = Integer.parseInt(String.valueOf(lv).trim()); }
            catch (NumberFormatException ignore) { level = 1; }
        }
        List<CmDashboardItem> all = cmDashboardItemService.getList(p);
        List<CmDashboardItem> rows = all;
        if (level > 0) {
            final int lvl = level;
            rows = all.stream()
                .filter(r -> r.getKeyLevel() != null && r.getKeyLevel() == lvl)
                .toList();
            /* 차트만 줄 때는 그릴 때 필요한 시리즈·항목을 하위 행에서 모아 함께 내려준다 */
            if (lvl == 1) cmDashboardDataGridService.attachChildren(rows, all);
        }
        return ResponseEntity.ok(ApiResponse.ok(rows));
    }

    @GetMapping("/item/{id}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemGetById(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.getById(id)));
    }

    @PostMapping("/item/save/{cmd}")
    public ResponseEntity<ApiResponse<CmDashboardItem>> itemSave(
            @PathVariable("cmd") String cmd,
            @Valid @RequestBody CmDashboardItem body) {
        validateSrcItemRef(body);
        fillChartCode(body);
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardItemService.save(cmd, body)));
    }

    @PostMapping("/item/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> itemSaveList(
            @PathVariable("cmd") String cmd,
            @Valid @RequestBody List<CmDashboardItem> rows) {
        rows.forEach(this::validateSrcItemRef);
        cmDashboardItemService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /**
     * 신규 차트(1레벨)의 조립코드를 채운다 — {@code chart001} 형식의 전역 일련번호.
     *
     * <p>{@code item_key} 가 전역 UNIQUE 라 화면이 임의로 정하면 충돌하기 쉽다. 저장 직전에
     * 서버가 현재 최대 번호 다음 값을 붙여 준다. 이미 코드가 있으면 건드리지 않는다(수정 저장).</p>
     *
     * <p><b>반드시 "신규 행"일 때만 채운다</b> — {@code dashboardItemId} 가 있으면(=기존 행 수정)
     * itemKey 를 안 보냈다고 여기서 새 번호를 지어 붙이면 안 된다. 화면이 일부 필드만 보내는
     * 부분수정(예: 시리즈표시방법만 저장)에서 이 가드가 없으면, itemKey 가 null → "신규"로
     * 오판 → 기존 차트의 item_key 가 엉뚱한 새 번호로 덮어써지는 사고가 난다(실제로 발생했던 버그,
     * 하위 행·데이터는 안 바뀌어 부모만 코드가 어긋나며 조용히 깨진다).</p>
     */
    private void fillChartCode(CmDashboardItem body) {
        if ("D".equals(body.getRowStatus())) return;
        if (body.getDashboardItemId() != null && !body.getDashboardItemId().isBlank()) return;   /* 기존 행 수정 — 건드리지 않는다 */
        if (body.getItemKey() != null && !body.getItemKey().isBlank()) return;   /* 화면이 이미 코드를 정함 */
        int next = cmDashboardItemService.nextChartSeq();
        String code = String.format("chart%03d", next);
        body.setItemKey(code);
        if (body.getItemTypeCd() == null || body.getItemTypeCd().isBlank()) body.setItemTypeCd("chart");
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

    /* ── 집계 데이터 (CmDashboardData, 3레벨 항목 실데이터) ───────────────────── */

    @GetMapping("/item-data/list")
    public ResponseEntity<ApiResponse<List<CmDashboardWidgetRow>>> itemDataList(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataService.getList(p)));
    }

    @PostMapping("/item-data/upsert")
    public ResponseEntity<ApiResponse<CmDashboardData>> itemDataUpsert(
            @Valid @RequestBody CmDashboardData body) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataService.upsert(body)));
    }

    /* ── 데이터관리 3레벨 그리드 (차트 × 시리즈 × 항목) ─────────────
     * 1레벨 차트명 / 2레벨 시리즈명(행) / 3레벨 항목명(열).
     * 기준조건: 사이트·기간 필수, 상품·업체 선택. 상세 → CmDashboardDataGridService */

    /**
     * 차트의 시리즈·항목 편집 결과를 정의행으로 동기화한다 (항목관리 저장).
     *
     * <p>조립코드가 같으면 같은 행으로 보고 갱신하므로 이름만 바꿔도 데이터가 끊기지 않는다.
     * 화면에서 사라진 코드는 그 행과 거기 붙어 있던 값까지 정리하고 건수를 돌려준다.</p>
     */
    @PostMapping("/item/{id}/children")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncChildren(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> series = body.get("series") instanceof List
            ? (List<Map<String, Object>>) body.get("series") : List.of();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cols = body.get("cols") instanceof List
            ? (List<Map<String, Object>>) body.get("cols") : List.of();
        /* cellOverrides — 시리즈×항목 "셀" 하나만 자동수집/수정가능여부·색을 따로 준 경우.
           key = 조립 item_key(예: chart038-series01-item01). 없는 셀은 cols(항목 1벌 공유값)를
           그대로 쓴다(2026-08-21, 화면에서 셀 단위 토글이 생기며 추가) */
        @SuppressWarnings("unchecked")
        Map<String, Object> cellOverrides = body.get("cellOverrides") instanceof Map
            ? (Map<String, Object>) body.get("cellOverrides") : Map.of();
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataGridService.syncChildren(id, series, cols, cellOverrides)));
    }

    /**
     * 항목 목록 3레벨 트리 — 차트(1) / 시리즈(2) / 항목(3).
     * 화면에서 들여쓰기로 그리도록 평면 배열로 준다. 각 노드에 lvl 과 조립된 itemCode 포함.
     */
    @GetMapping("/item/tree")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> itemTree(
            @RequestParam String dashboardId) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataGridService.getItemTree(dashboardId)));
    }

    /** 그리드 조회 — 대시보드 안의 CHART 항목마다 그리드 1개를 만들어 돌려준다 */
    @GetMapping("/data-grid")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dataGrid(
            @RequestParam String dashboardId,
            @RequestParam String siteId,
            @RequestParam String yyyymmdd,
            @RequestParam(required = false) String prodId,
            @RequestParam(required = false) String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(
            cmDashboardDataGridService.getGrids(dashboardId, siteId, yyyymmdd, prodId, vendorId)));
    }

    /** 그리드 저장 — 차트×시리즈 조합마다 1행 upsert (값이 전부 빈 시리즈는 저장하지 않음) */
    @PostMapping("/data-grid/save")
    public ResponseEntity<ApiResponse<Integer>> dataGridSave(
            @RequestParam String siteId,
            @RequestParam String yyyymmdd,
            @RequestParam(required = false) String periodTypeCd,
            @RequestParam(required = false) String prodId,
            @RequestParam(required = false) String vendorId,
            @RequestBody List<Map<String, Object>> charts) {
        int n = cmDashboardDataGridService.saveGrids(
            siteId, yyyymmdd, periodTypeCd, prodId, vendorId, charts);
        return ResponseEntity.ok(ApiResponse.ok(n, "저장되었습니다. (" + n + "건)"));
    }

    /** 시뮬레이션 — 값만 자동 생성해 돌려준다(저장하지 않음). 사용자가 확인 후 [저장] */
    @GetMapping("/data-grid/simulate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dataGridSimulate(
            @RequestParam String dashboardId,
            @RequestParam String siteId,
            @RequestParam String yyyymmdd,
            @RequestParam(required = false) String periodTypeCd,
            @RequestParam(required = false) String prodId,
            @RequestParam(required = false) String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(cmDashboardDataGridService.simulate(
            dashboardId, siteId, yyyymmdd, periodTypeCd, prodId, vendorId)));
    }
    /* ── 좌측메뉴 트리 ─────────────────────────────────────────
     * 폴더 + 대시보드 아이템으로 구성. 노드가 하나도 없으면 프론트가
     * "볼 수 있는 대시보드 전체" 로 폴백한다.
     *
     * scope = USER : 사용자별 트리(좌측 `사용자 대시보드` 그룹). 소유자는 세션 고정
     * scope = SYS  : 사이트 공통 트리(좌측 `대시보드` 그룹). 주인이 없어 전원에게 같게 보인다 */

    /** 클라이언트가 보낸 scope 를 USER/SYS 둘 중 하나로 좁힌다 — 그 외 값은 USER 로 본다 */
    private static String normScope(String scope) {
        return "SYS".equalsIgnoreCase(scope) ? "SYS" : "USER";
    }

    @GetMapping("/menu/tree")
    public ResponseEntity<ApiResponse<List<CmDashboardMenu>>> menuTree(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String scope) {
        String sid = siteId == null ? SecurityUtil.getSiteId() : siteId;
        String scp = normScope(scope);
        if ("SYS".equals(scp)) {
            return ResponseEntity.ok(ApiResponse.ok(
                cmDashboardMenuRepository.findByMenuScopeCdOrderBySortOrdAsc(scp)));
        }
        String uid = SecurityUtil.getAuthUser().authId();
        return ResponseEntity.ok(ApiResponse.ok(
            cmDashboardMenuRepository.findByMenuScopeCdAndOwnerUserIdOrderBySortOrdAsc(scp, uid)));
    }

    /**
     * 트리 통째 저장 — 해당 범위의 노드를 전부 지우고 받은 목록으로 다시 넣는다.
     *
     * <p>부분 갱신보다 단순하고 순서·부모가 한 번에 정합하게 맞는다.
     * USER 범위의 소유자는 서버가 세션에서 채우므로 남의 트리를 건드릴 수 없다.</p>
     */
    @PostMapping("/menu/save")
    @Transactional
    public ResponseEntity<ApiResponse<Integer>> menuSave(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String scope,
            @Valid @RequestBody List<CmDashboardMenu> nodes) {
        String sid = siteId == null ? SecurityUtil.getSiteId() : siteId;
        String scp = normScope(scope);
        String uid = SecurityUtil.getAuthUser().authId();
        if ("SYS".equals(scp)) cmDashboardMenuRepository.deleteByMenuScopeCd(scp);
        else                   cmDashboardMenuRepository.deleteByMenuScopeCdAndOwnerUserId(scp, uid);
        cmDashboardMenuRepository.flush();
        LocalDateTime now = LocalDateTime.now();
        /* 클라이언트는 임시 키로 부모를 가리킨다. 실제 ID 를 새로 만들면서 키→ID 로 바꿔준다
           (그냥 재생성만 하면 parentNodeId 가 끊어진 키를 가리켜 트리가 무너진다). */
        java.util.Map<String, String> keyToId = new java.util.LinkedHashMap<>();
        for (CmDashboardMenu n : nodes) {
            keyToId.put(n.getDashboardMenuId(), CmUtil.generateId("cm_dashboard_menu"));
        }
        int i = 0;
        for (CmDashboardMenu n : nodes) {
            String pk = n.getParentNodeId();
            n.setParentNodeId(pk == null || pk.isBlank() ? null : keyToId.get(pk));
            n.setDashboardMenuId(keyToId.get(n.getDashboardMenuId()));
            n.setMenuScopeCd(scp);
            /* SYS 는 주인이 없다. USER 는 세션 고정 — 클라이언트 값 무시 */
            n.setOwnerUserId("SYS".equals(scp) ? null : uid);
            n.setSortOrd(++i * 10);
            if (n.getUseYn() == null) n.setUseYn("Y");
            n.setRegBy(uid); n.setRegDate(now);
            n.setUpdBy(uid); n.setUpdDate(now);
        }
        cmDashboardMenuRepository.saveAll(nodes);
        return ResponseEntity.ok(ApiResponse.ok(nodes.size(), "저장되었습니다."));
    }

}
