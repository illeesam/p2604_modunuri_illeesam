package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 대시보드 데이터관리(3레벨) 그리드 서비스.
 *
 * <p><b>3레벨 구조</b> — 화면의 "차트마다 그리드" 는 이 세 축으로 만들어진다.</p>
 * <pre>
 *   1레벨 차트명   cm_dashboard_item.item_nm          → 그리드 1개
 *   2레벨 시리즈명 cm_dashboard_item_data.series_nm   → 그리드의 행 제목
 *   3레벨 항목명   cm_dashboard_item_data.col1~9_nm   → 그리드의 열 제목
 * </pre>
 *
 * <p>시리즈(2레벨) 목록은 {@code cm_dashboard_item.series_json} 의 {@code [{name,...}]} 에서 읽는다.
 * 정의가 비어 있으면 단일 시리즈(이름 없음) 한 행으로 다룬다 — 시리즈 개념이 없는 차트도
 * 같은 그리드로 편집할 수 있게 하기 위함이다.</p>
 *
 * <p>기준조건은 사이트·기간이 필수, 상품·업체는 선택이다. 선택 조건을 지정하지 않으면
 * 해당 컬럼이 NULL 인 행(=그 차원으로 나누지 않은 전체 집계)만 대상으로 한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardDataGridService {

    /** 한 행에서 가로로 펼칠 수 있는 3레벨 항목 최대 개수 (col1~col9) */
    public static final int MAX_COLS = 9;

    private final CmDashboardItemRepository itemRepository;
    private final CmDashboardItemDataRepository dataRepository;

    private static final ObjectMapper OM = new ObjectMapper();

    @PersistenceContext
    private EntityManager em;

    /* ── 항목 목록 3레벨 트리 ──────────────────────────────────────────────── */

    /**
     * 대시보드의 항목 구조를 3레벨 평면 트리로 만든다 (항목관리 화면의 "항목 목록").
     *
     * <pre>
     *   lvl 1  차트    item_key            COMP0101 · 월별 매출현황
     *   lvl 2  시리즈  series_json[].cd    └ CH_COUPANG · 쿠팡
     *   lvl 3  항목    cols_json[].cd        └ M01 · 1월
     * </pre>
     *
     * <p>고유 코드({@code itemCode})는 저장하지 않고 레벨 코드를 {@code -} 로 이어 만든다 —
     * 중간 레벨 코드가 바뀌면 하위가 자동으로 따라오고, 같은 값을 두 곳에 저장해 어긋날 일이 없다.
     * 예: {@code COMP0101-CH_COUPANG-M01}</p>
     *
     * <p>트리는 화면에서 들여쓰기로 그리기 쉽도록 <b>평면 배열</b>로 돌려준다(부모 중첩 아님).
     * 각 노드는 {@code lvl}(1|2|3) 과 {@code itemCode} 를 갖는다.</p>
     */
    public List<Map<String, Object>> getItemTree(String dashboardId) {
        /* 정의 테이블이 곧 트리다 — series/item 이 실제 행으로 존재하므로 JSON 을 풀 필요가 없다.
           parent_dashboard_item_id 로 이어 붙이고 화면이 그리기 쉽도록 평면 배열로 돌려준다. */
        List<CmDashboardItem> all = itemRepository.findByDashboardIdOrderBySortOrdAsc(dashboardId);

        Map<String, List<CmDashboardItem>> byParent = new LinkedHashMap<>();
        List<CmDashboardItem> charts = new ArrayList<>();
        for (CmDashboardItem it : all) {
            if ("chart".equals(it.getItemTypeCd())) charts.add(it);
            else byParent.computeIfAbsent(nvlStr(it.getParentDashboardItemId(), ""), k -> new ArrayList<>()).add(it);
        }
        Comparator<CmDashboardItem> bySort =
            Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());
        byParent.values().forEach(v -> v.sort(bySort));
        charts.sort(bySort);

        List<Map<String, Object>> out = new ArrayList<>();
        for (CmDashboardItem ch : charts) {
            out.add(treeNode(1, ch));
            for (CmDashboardItem se : byParent.getOrDefault(ch.getDashboardItemId(), List.of())) {
                out.add(treeNode(2, se));
                for (CmDashboardItem it : byParent.getOrDefault(se.getDashboardItemId(), List.of())) {
                    out.add(treeNode(3, it));
                }
            }
        }
        return out;
    }

    /**
     * 차트 목록에 시리즈·항목을 붙인다 (조회 전용).
     *
     * <p>{@code series_json/cols_json} 폐기 후, 차트를 그리는 쪽이 시리즈 이름·색을 알 방법이
     * 하위 행뿐이다. 목록을 줄 때 한 번에 모아 붙여 화면이 추가 호출을 하지 않게 한다.</p>
     *
     * @param charts 대상 차트(1레벨) 목록 — 여기에 series/cols 를 채운다
     * @param all    같은 조회에서 얻은 전체 행(하위 포함)
     */
    public void attachChildren(List<CmDashboardItem> charts, List<CmDashboardItem> all) {
        Map<String, List<CmDashboardItem>> byParent = new LinkedHashMap<>();
        for (CmDashboardItem it : all) {
            if (it.getParentDashboardItemId() == null) continue;
            byParent.computeIfAbsent(it.getParentDashboardItemId(), k -> new ArrayList<>()).add(it);
        }
        Comparator<CmDashboardItem> bySort = Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());
        byParent.values().forEach(v -> v.sort(bySort));

        for (CmDashboardItem ch : charts) {
            List<CmDashboardItem> sers = byParent.getOrDefault(ch.getDashboardItemId(), List.of());
            ch.setSeries(sers.stream().map(CmDashboardDataGridService::brief).toList());
            List<CmDashboardItem> cols = sers.isEmpty() ? List.<CmDashboardItem>of()
                : byParent.getOrDefault(sers.get(0).getDashboardItemId(), List.of());
            ch.setCols(cols.stream().map(CmDashboardDataGridService::brief).toList());
        }
    }

    /** 화면이 쓰는 최소 정보만 */
    private static Map<String, Object> brief(CmDashboardItem it) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dashboardItemId", it.getDashboardItemId());
        m.put("itemKey", it.getItemKey());
        m.put("cd", it.getKeyNm());
        m.put("name", it.getItemNm());
        m.put("color", it.getItemColor());
        return m;
    }

    /* ── 하위 정의행 동기화 (항목관리 저장) ───────────────────────────────── */

    /**
     * 차트의 시리즈·항목 편집 결과를 실제 정의행으로 반영한다.
     *
     * <p>화면은 시리즈/항목을 그리드로 편집하지만 조회·연동의 기준은 어디까지나 <b>행</b>이므로,
     * 저장 시 여기서 하위 행을 만들고/고치고/지워 트리와 화면을 일치시킨다.</p>
     *
     * <p>기준은 조립코드({@code item_code})다 — 이름을 바꿔도 코드가 같으면 같은 행으로 보고
     * 갱신하므로, 붙어 있던 데이터가 끊기지 않는다. 반대로 코드가 사라지면 그 행과
     * <b>거기 붙어 있던 데이터까지</b> 지운다(값이 놓일 자리가 없어지므로).</p>
     *
     * @param chartId 차트(1레벨) 정의행 ID
     * @param series  [{cd,name,color}] 순서가 곧 표시 순서
     * @param cols    [{cd,name}] — 축이 DATE 면 무시(항목행을 두지 않는다)
     */
    @Transactional
    public Map<String, Object> syncChildren(String chartId,
                                            List<Map<String, Object>> series,
                                            List<Map<String, Object>> cols) {
        CmDashboardItem ch = itemRepository.findById(chartId)
            .orElseThrow(() -> new CmBizException("존재하지 않는 차트입니다: " + chartId));
        if (!"chart".equals(ch.getItemTypeCd()))
            throw new CmBizException("차트(1레벨) 행이 아닙니다: " + chartId);

        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        String chartCd = nvlStr(ch.getItemKey(), "");
        boolean dateAxis = "DATE".equals(ch.getAxisTypeCd());

        /* 기존 하위행 색인 — 조립코드(코드 유지 시)와 PK(키명 변경 시) 두 가지로 찾는다.
           화면이 dashboardItemId 를 함께 보내면 key_nm 을 바꿔도 같은 행으로 인식해
           삭제 후 재생성이 아니라 "코드 변경 + 하위/데이터 연쇄 갱신" 으로 처리된다. */
        Map<String, CmDashboardItem> exist = new LinkedHashMap<>();
        Map<String, CmDashboardItem> byPk = new LinkedHashMap<>();
        for (CmDashboardItem d : descendantsOf(ch)) {
            exist.put(d.getItemKey(), d);
            byPk.put(d.getDashboardItemId(), d);
        }

        Set<String> keep = new LinkedHashSet<>();
        int upSer = 0, upItm = 0;

        /* 옛 코드·키명은 루프에 들어가기 전에 스냅샷으로 굳힌다.
           byPk 가 들고 있는 것은 영속 엔티티라, 첫 시리즈에서 keyNm 을 바꾸면 그 값이 곧바로
           보여 두 번째 시리즈부터는 "안 바뀐 것" 으로 오판하고 삭제 후 재생성해 버린다. */
        List<Map<String, Object>> serList = series == null ? List.of() : series;
        List<Map<String, Object>> colList = cols == null ? List.of() : cols;
        List<String> serOldCodes = new ArrayList<>();
        for (Map<String, Object> sm : serList) serOldCodes.add(oldCodeOf(byPk, str(sm.get("dashboardItemId"))));
        List<String> colOldCds = new ArrayList<>();
        for (Map<String, Object> cm : colList) colOldCds.add(keyNmOf(byPk, str(cm.get("dashboardItemId"))));
        for (int si = 0; si < serList.size(); si++) {
            Map<String, Object> sm = serList.get(si);
            String sCd = codeOf(sm, "series", si);
            String sCode = chartCd + "-" + sCd;
            renameByCode(exist, serOldCodes.get(si), sCode, sCd);
            CmDashboardItem se = putRow(exist, keep, sCode, sCd, str(sm.get("name")), str(sm.get("color")),
                "series", ch.getDashboardId(), ch.getDashboardItemId(), chartCd, (si + 1) * 10, authId, now);
            upSer++;

            if (dateAxis) continue;   /* 날짜축은 항목행 없이 yyyymmdd 가 축 */
            for (int ci = 0; ci < colList.size(); ci++) {
                Map<String, Object> cm = colList.get(ci);
                String cCd = codeOf(cm, "item", ci);
                /* 열 정의는 시리즈 전체가 공유하는 1벌이라 cm 의 PK 는 특정 시리즈의 자식 하나만
                   가리킨다. 그 PK 로 다른 시리즈의 행까지 바꾸면 남의 코드를 덮어써 UNIQUE 가 깨진다.
                   그래서 PK 에서는 "옛 키명" 만 얻고, 실제 대상은 시리즈별 조립코드로 찾는다. */
                String cOldCd = colOldCds.get(ci);
                if (cOldCd != null)
                    renameByCode(exist, sCode + "-" + cOldCd, sCode + "-" + cCd, cCd);
                putRow(exist, keep, sCode + "-" + cCd, cCd, str(cm.get("name")), null,
                    "item", ch.getDashboardId(), se.getDashboardItemId(), sCode, (ci + 1) * 10, authId, now);
                upItm++;
            }
        }

        /* 남은 것 = 화면에서 사라진 행 → 붙어있던 데이터까지 정리 */
        int delRow = 0, delData = 0;
        for (Map.Entry<String, CmDashboardItem> e : exist.entrySet()) {
            if (keep.contains(e.getKey())) continue;
            delData += dataRepository.deleteByItemKey(e.getKey());
            itemRepository.delete(e.getValue());
            delRow++;
        }
        em.flush();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("series", upSer);
        out.put("items", upItm);
        out.put("deletedRows", delRow);
        out.put("deletedData", delData);
        return out;
    }

    /** 차트 아래 모든 시리즈·항목 행 */
    private List<CmDashboardItem> descendantsOf(CmDashboardItem ch) {
        List<CmDashboardItem> all = itemRepository.findByDashboardIdOrderBySortOrdAsc(ch.getDashboardId());
        Map<String, List<CmDashboardItem>> byParent = new LinkedHashMap<>();
        for (CmDashboardItem it : all) {
            if (it.getParentDashboardItemId() == null) continue;
            byParent.computeIfAbsent(it.getParentDashboardItemId(), k -> new ArrayList<>()).add(it);
        }
        List<CmDashboardItem> out = new ArrayList<>();
        for (CmDashboardItem se : byParent.getOrDefault(ch.getDashboardItemId(), List.of())) {
            out.add(se);
            out.addAll(byParent.getOrDefault(se.getDashboardItemId(), List.of()));
        }
        return out;
    }

    /** 한 행 반영 — 코드가 있으면 갱신, 없으면 생성 */
    private CmDashboardItem putRow(Map<String, CmDashboardItem> exist, Set<String> keep,
                                   String itemCode, String ownCd, String nm, String color, String lvlCd,
                                   String dashboardId, String parentId, String parentCode,
                                   int sortOrd, String authId, LocalDateTime now) {
        keep.add(itemCode);
        CmDashboardItem row = exist.get(itemCode);
        if (row == null) {
            row = new CmDashboardItem();
            row.setDashboardItemId(CmUtil.generateId("cm_dashboard_item"));
            row.setRegBy(authId);
            row.setRegDate(now);
        }
        row.setDashboardId(dashboardId);
        row.setItemKey(itemCode);        /* item_key = 조립코드 (UNIQUE) */
        row.setItemNm(nvlStr(nm, ownCd));
        row.setItemColor(blankToNull(color));
        row.setItemTypeCd(lvlCd);
        row.setKeyLevel("chart".equals(lvlCd) ? 1 : ("series".equals(lvlCd) ? 2 : 3));
        row.setKeyNm(ownCd);
        row.setParentDashboardItemId(parentId);
        row.setSortOrd(sortOrd);
        row.setUseYn("Y");
        row.setUpdBy(authId);
        row.setUpdDate(now);
        return itemRepository.save(row);
    }

    /** 화면이 보낸 PK 로 기존 행의 조립코드를 되짚는다 (신규 행이면 null) */
    private String oldCodeOf(Map<String, CmDashboardItem> byPk, String pk) {
        if (pk == null || pk.isBlank()) return null;
        CmDashboardItem row = byPk.get(pk);
        return row == null ? null : row.getItemKey();
    }

    /** 화면이 보낸 PK 로 기존 행의 키명을 되짚는다 (신규 행이면 null) */
    private String keyNmOf(Map<String, CmDashboardItem> byPk, String pk) {
        if (pk == null || pk.isBlank()) return null;
        CmDashboardItem row = byPk.get(pk);
        return row == null ? null : row.getKeyNm();
    }

    /**
     * 키명(key_nm) 변경 처리 — 같은 행인데 조립코드만 달라진 경우.
     *
     * <p>기존 조립코드로 행을 찾아 그 행과 <b>모든 하위 행</b>의 {@code item_key} 를 새 코드로 바꾸고,
     * 거기 붙어 있던 {@code cm_dashboard_item_data.item_key} 까지 함께 갱신한다.
     * 이 처리를 안 하면 코드가 달라진 순간 "사라진 행" 으로 보여 데이터까지 지워진다.</p>
     *
     * <p>대상을 PK 가 아니라 <b>옛 조립코드</b>로 잡는 이유: 열(3레벨) 정의는 시리즈 전체가
     * 공유하는 1벌이라 PK 하나가 모든 시리즈의 자식을 대표하지 못한다. 코드로 찾으면
     * 시리즈마다 자기 행만 정확히 바뀐다.</p>
     *
     * <p>색인({@code exist})도 새 코드로 다시 걸어 뒤이은 putRow 가 같은 행을 집도록 한다.</p>
     */
    private void renameByCode(Map<String, CmDashboardItem> exist,
                              String oldCode, String newCode, String newKeyNm) {
        if (oldCode == null || oldCode.isBlank() || oldCode.equals(newCode)) return;
        CmDashboardItem row = exist.get(oldCode);
        if (row == null) return;                 /* 이미 옮겨졌거나 없는 행 */
        if (exist.containsKey(newCode)) return;  /* 새 코드 자리에 이미 다른 행이 있으면 건드리지 않는다 */

        row.setItemKey(newCode);
        row.setKeyNm(newKeyNm);
        itemRepository.save(row);
        dataRepository.updateItemKey(oldCode, newCode);
        exist.remove(oldCode);
        exist.put(newCode, row);

        /* 하위 행 — 접두어를 새 코드로 치환 (색인 순회 중 수정이라 사본으로 돈다) */
        for (Map.Entry<String, CmDashboardItem> e : new ArrayList<>(exist.entrySet())) {
            String c = e.getKey();
            if (!c.startsWith(oldCode + "-")) continue;
            String nc = newCode + c.substring(oldCode.length());
            CmDashboardItem d = e.getValue();
            d.setItemKey(nc);
            itemRepository.save(d);
            dataRepository.updateItemKey(c, nc);
            exist.remove(c);
            exist.put(nc, d);
        }
        em.flush();
        log.info("[대시보드항목] 키명 변경 연쇄: {} -> {}", oldCode, newCode);
    }

    /** 코드 조각 — 화면이 준 cd 를 쓰되 비었으면 seriesNN / itemNN 으로 채운다 */
    private static String codeOf(Map<String, Object> m, String prefix, int idx) {
        String cd = str(m.get("cd"));
        if (cd != null && !cd.isBlank()) return cd.trim().replace("-", "_");   /* 구분자와 충돌 방지 */
        return prefix + String.format("%02d", idx + 1);
    }

    /** 트리 노드 1개 — 화면은 lvl 로 들여쓰고 itemCode 로 식별한다 */
    private Map<String, Object> treeNode(int lvl, CmDashboardItem it) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("lvl", lvl);
        m.put("dashboardItemId", it.getDashboardItemId());
        m.put("parentDashboardItemId", it.getParentDashboardItemId());
        m.put("itemKey", it.getItemKey());
        m.put("itemCd", lastSeg(it.getItemKey()));
        m.put("itemNm", it.getItemNm());
        m.put("itemColor", it.getItemColor());
        m.put("sortOrd", it.getSortOrd());
        m.put("useYn", it.getUseYn());
        if (lvl == 1) {
            m.put("itemTypeCd",  it.getItemTypeCd());
            m.put("widgetTypeCd", it.getWidgetTypeCd());
            m.put("chartTypeCd", it.getChartTypeCd());
            m.put("axisTypeCd",  it.getAxisTypeCd());
            m.put("lvl1CodeGrp", it.getLvl1CodeGrp());
            m.put("lvl2CodeGrp", it.getLvl2CodeGrp());
        }
        return m;
    }

    /** 조립코드의 마지막 조각 (chart001-series01-item01 → item01) */
    private static String lastSeg(String code) {
        String c = nvlStr(code, "");
        int i = c.lastIndexOf('-');
        return i < 0 ? c : c.substring(i + 1);
    }

    /**
     * 데이터 좌표 키 — 값이 있는 차원만 key:value 로 만들어 key 오름차순으로 잇는다.
     *
     * <p>차원이 늘어도 컬럼을 새로 만들 필요가 없고, {@code (dashboard_item_id, options)} 가
     * UNIQUE 라 같은 좌표가 다시 들어오면 새 행 대신 그 행을 갱신하면 된다.</p>
     */
    public static String buildOptions(CmDashboardItemData d) {
        Map<String, String> dim = new TreeMap<>();   /* TreeMap = key 오름차순 자동 */
        putDim(dim, "dept_id",        d.getDeptId());
        putDim(dim, "period_type_cd", d.getPeriodTypeCd());
        putDim(dim, "prod_id",        d.getProdId());
        putDim(dim, "site_id",        d.getSiteId());
        putDim(dim, "user_id",        d.getUserId());
        putDim(dim, "vendor_id",      d.getVendorId());
        putDim(dim, "yyyymmdd",       d.getYyyymmdd());
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : dim.entrySet()) {
            if (sb.length() > 0) sb.append(',');
            sb.append(e.getKey()).append(':').append(e.getValue());
        }
        return sb.toString();
    }

    private static void putDim(Map<String, String> m, String k, String v) {
        if (v != null && !v.isBlank()) m.put(k, v.trim());
    }




    /** 레벨 코드 잇기 — 빈 조각은 건너뛴다(중간 코드가 없어도 코드가 '--' 로 깨지지 않게) */
    private static String join(String a, String b) {
        if (a == null || a.isBlank()) return nvl(b);
        if (b == null || b.isBlank()) return a;
        return a + "-" + b;
    }

    /* ── 조회 ─────────────────────────────────────────────────────────────── */

    /**
     * 기준조건에 해당하는 "차트별 그리드" 묶음을 만든다.
     *
     * @param dashboardId 대상 대시보드 (이 안의 CHART 항목들만 그리드로 만든다)
     * @param siteId      사이트ID (필수)
     * @param yyyymmdd    기간 키 — D 면 YYYYMMDD, M 이면 YYYYMM00 (필수)
     * @param prodId      상품ID (선택, null 이면 상품 미지정 행)
     * @param vendorId    업체ID (선택, null 이면 업체 미지정 행)
     * @return charts: [{dashboardItemId, itemNm, chartTypeCd, colNms[], rows:[{seriesNm, vals[]}]}]
     */
    public Map<String, Object> getGrids(String dashboardId, String siteId, String yyyymmdd,
                                        String prodId, String vendorId) {
        requireCond(siteId, yyyymmdd);

        /* 정의 트리를 통째로 읽어 차트 -> 시리즈 -> 항목 으로 묶는다 (행이 곧 구조) */
        List<CmDashboardItem> all = itemRepository.findByDashboardIdOrderBySortOrdAsc(dashboardId);
        Map<String, List<CmDashboardItem>> byParent = new LinkedHashMap<>();
        List<CmDashboardItem> charts0 = new ArrayList<>();
        for (CmDashboardItem it : all) {
            if ("chart".equals(it.getItemTypeCd())) { if (!"N".equals(it.getUseYn())) charts0.add(it); }
            else byParent.computeIfAbsent(nvlStr(it.getParentDashboardItemId(), ""), k -> new ArrayList<>()).add(it);
        }
        Comparator<CmDashboardItem> bySort = Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());
        byParent.values().forEach(v -> v.sort(bySort));
        charts0.sort(bySort);

        /* 값은 시리즈행·항목행 어디에도 붙을 수 있으므로 정의행 전체를 한 번에 읽는다 */
        List<String> allIds = all.stream().map(CmDashboardItem::getDashboardItemId).toList();
        Map<String, CmDashboardItemData> valueOf = new LinkedHashMap<>();
        if (!allIds.isEmpty()) {
            for (CmDashboardItemData d : findRows(siteId, yyyymmdd, allIds, prodId, vendorId)) {
                valueOf.put(d.getDashboardItemId(), d);   /* (정의행, 좌표) 가 UNIQUE 라 1:1 */
            }
        }

        List<Map<String, Object>> charts = new ArrayList<>();
        for (CmDashboardItem ch : charts0) {
            List<CmDashboardItem> sers = byParent.getOrDefault(ch.getDashboardItemId(), List.of());
            boolean dateAxis = "DATE".equals(ch.getAxisTypeCd());

            /* 열(3레벨) — 첫 시리즈의 항목행이 곧 열 정의. DATE 축은 항목행이 없다 */
            List<CmDashboardItem> cols0 = sers.isEmpty() ? List.<CmDashboardItem>of()
                : byParent.getOrDefault(sers.get(0).getDashboardItemId(), List.of());
            String[] colNms = new String[MAX_COLS];
            String[] colCds = new String[MAX_COLS];
            for (int i2 = 0; i2 < Math.min(cols0.size(), MAX_COLS); i2++) {
                colNms[i2] = cols0.get(i2).getItemNm();
                colCds[i2] = lastSeg(cols0.get(i2).getItemKey());
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            for (CmDashboardItem se : sers) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("dashboardItemId", se.getDashboardItemId());
                row.put("seriesNm", se.getItemNm());
                row.put("seriesCd", lastSeg(se.getItemKey()));
                row.put("itemKey", se.getItemKey());

                List<Object> vals = new ArrayList<>();
                List<Object> cellIds = new ArrayList<>();
                if (dateAxis) {
                    /* 날짜축: 항목행이 없어 시리즈행 한 곳에 col1~col9 로 담는다 */
                    CmDashboardItemData d = valueOf.get(se.getDashboardItemId());
                    vals = new ArrayList<>(java.util.Arrays.asList(readVals(d)));
                    row.put("dashboardItemDataId", d != null ? d.getDashboardItemDataId() : null);
                } else {
                    /* 카테고리축: 셀 하나가 항목행 하나 — 값은 그 행의 col1_num */
                    List<CmDashboardItem> myCols = byParent.getOrDefault(se.getDashboardItemId(), List.of());
                    for (int i2 = 0; i2 < Math.min(myCols.size(), MAX_COLS); i2++) {
                        CmDashboardItemData d = valueOf.get(myCols.get(i2).getDashboardItemId());
                        vals.add(d != null ? d.getCol1Num() : null);
                        cellIds.add(myCols.get(i2).getDashboardItemId());
                    }
                    row.put("cellItemIds", cellIds);   /* 저장 시 셀->정의행 매핑에 쓴다 */
                }
                row.put("vals", vals);
                rows.add(row);
            }

            Map<String, Object> chart = new LinkedHashMap<>();
            chart.put("dashboardItemId", ch.getDashboardItemId());
            chart.put("itemKey",        ch.getItemKey());
            chart.put("itemNm",          ch.getItemNm());
            chart.put("chartTypeCd",     ch.getChartTypeCd());
            chart.put("widgetTypeCd",    ch.getWidgetTypeCd());
            chart.put("axisTypeCd",      nvlStr(ch.getAxisTypeCd(), "CATEGORY"));
            chart.put("colNms",          colNms);
            chart.put("colCds",          colCds);
            chart.put("colsFixed",       !dateAxis);   /* 항목행이 기준이라 열 제목은 항목관리에서만 바꾼다 */
            chart.put("rows",            rows);
            charts.add(chart);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("charts", charts);
        return out;
    }

    /* ── 저장 ─────────────────────────────────────────────────────────────── */

    /**
     * 그리드 전체 저장. 차트 × 시리즈 조합마다 1행을 upsert 한다.
     *
     * <p>같은 기준조건의 같은 (차트, 시리즈) 행이 이미 있으면 갱신, 없으면 신규 생성한다.
     * 값이 하나도 없는(전부 null) 시리즈 행은 저장하지 않는다 — 빈 행이 쌓이는 것을 막는다.</p>
     *
     * @param charts [{dashboardItemId, colNms[], rows:[{seriesNm, vals[]}]}]
     * @return 저장된 행 수
     */
    @Transactional
    public int saveGrids(String siteId, String yyyymmdd, String periodTypeCd,
                         String prodId, String vendorId, List<Map<String, Object>> charts) {
        requireCond(siteId, yyyymmdd);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        String pId = blankToNull(prodId);
        String vId = blankToNull(vendorId);
        String per = "M".equals(periodTypeCd) ? "M" : "D";

        int saved = 0;
        for (Map<String, Object> chart : charts == null ? List.<Map<String, Object>>of() : charts) {
            String chartId = str(chart.get("dashboardItemId"));
            if (chartId == null) continue;
            CmDashboardItem ch = itemRepository.findById(chartId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 차트입니다: " + chartId));
            boolean dateAxis = "DATE".equals(ch.getAxisTypeCd());

            for (Object rowObj : asList(chart.get("rows"))) {
                if (!(rowObj instanceof Map<?, ?> row)) continue;
                List<?> vals = asList(row.get("vals"));

                if (dateAxis) {
                    /* 날짜축: 시리즈행 한 곳에 col1~col9 로 저장 (열이 곧 기간 내 구간) */
                    String serId = str(row.get("dashboardItemId"));
                    if (serId == null || isAllEmpty(vals)) continue;
                    CmDashboardItemData e = upsert(serId, siteId, yyyymmdd, per, pId, vId, ch, authId, now);
                    writeVals(e, vals);
                    dataRepository.save(e);
                    saved++;
                } else {
                    /* 카테고리축: 셀 하나 = 항목행 하나 = 데이터 한 행(col1_num) */
                    List<?> cellIds = asList(row.get("cellItemIds"));
                    for (int i2 = 0; i2 < cellIds.size() && i2 < vals.size(); i2++) {
                        String leafId = str(cellIds.get(i2));
                        if (leafId == null) continue;
                        Double v = toDouble(vals.get(i2));
                        CmDashboardItemData e = upsert(leafId, siteId, yyyymmdd, per, pId, vId, ch, authId, now);
                        e.setCol1Num(v);
                        dataRepository.save(e);
                        saved++;
                    }
                }
            }
        }
        em.flush();
        return saved;
    }

    /**
     * 좌표(정의행 + options)로 기존 행을 찾아 없으면 만든다.
     *
     * <p>{@code (dashboard_item_id, options)} 가 UNIQUE 이므로 같은 좌표에 두 행이 생기지 않는다 —
     * 다시 저장하면 새 행이 아니라 그 행이 갱신된다.</p>
     */
    private CmDashboardItemData upsert(String defItemId, String siteId, String yyyymmdd, String per,
                                       String pId, String vId, CmDashboardItem ch,
                                       String authId, LocalDateTime now) {
        CmDashboardItemData probe = new CmDashboardItemData();
        probe.setSiteId(siteId);
        probe.setYyyymmdd(yyyymmdd);
        probe.setPeriodTypeCd(per);
        probe.setProdId(pId);
        probe.setVendorId(vId);
        String options = buildOptions(probe);

        /* item_key = 값이 붙는 정의행의 조립코드. (item_key, options) 가 UNIQUE 라 이 둘로 찾는다 */
        String itemKey = itemRepository.findById(defItemId)
            .map(CmDashboardItem::getItemKey)
            .orElseThrow(() -> new CmBizException("존재하지 않는 정의행입니다: " + defItemId));

        CmDashboardItemData e = dataRepository
            .findByItemKeyAndOptions(itemKey, options)
            .orElseGet(() -> {
                CmDashboardItemData n = new CmDashboardItemData();
                n.setDashboardItemDataId(CmUtil.generateId("cm_dashboard_item_data"));
                n.setRegBy(authId);
                n.setRegDate(now);
                return n;
            });
        e.setDashboardItemId(defItemId);
        e.setDashboardId(ch.getDashboardId());
        e.setOptions(options);
        e.setUiNm(nvlStr(ch.getItemNm(), "-"));   /* NOT NULL 역정규화 */
        e.setItemKey(itemKey);
        e.setSiteId(siteId);
        e.setYyyymmdd(yyyymmdd);
        e.setPeriodTypeCd(per);
        e.setProdId(pId);
        e.setVendorId(vId);
        e.setUpdBy(authId);
        e.setUpdDate(now);
        return e;
    }

    private static Double toDouble(Object o) {
        if (o == null || String.valueOf(o).isBlank()) return null;
        try { return Double.valueOf(String.valueOf(o).replace(",", "").trim()); }
        catch (NumberFormatException e) { return null; }
    }

    /* ── 시뮬레이션 ───────────────────────────────────────────────────────── */

    /**
     * 값 자동 채우기 — 저장하지 않고 화면에 채울 값만 만들어 돌려준다.
     *
     * <p>사람이 직접 입력하는 화면이라 "그럴듯한 숫자"를 한 번에 넣어보고 싶을 때 쓴다.
     * 저장은 사용자가 [저장]을 눌러야 일어난다(시뮬레이션 자체는 DB를 건드리지 않는다).</p>
     *
     * <p>열 제목(3레벨)이 비어 있으면 기간구분에 맞춰 기본 항목명을 만들어 준다 —
     * M 이면 1월~, D 면 해당 일자 기준 요일/구간 라벨 대신 단순 항목1.. 로 둔다.</p>
     */
    public Map<String, Object> simulate(String dashboardId, String siteId, String yyyymmdd,
                                        String periodTypeCd, String prodId, String vendorId) {
        Map<String, Object> grids = getGrids(dashboardId, siteId, yyyymmdd, prodId, vendorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> charts = (List<Map<String, Object>>) grids.get("charts");

        boolean monthly = "M".equals(periodTypeCd);
        for (Map<String, Object> chart : charts) {
            String[] colNms = (String[]) chart.get("colNms");
            /* 열 제목이 하나도 없으면 기본 항목명 4개를 만들어 준다 */
            boolean hasAnyCol = false;
            for (String c : colNms) if (c != null && !c.isBlank()) { hasAnyCol = true; break; }
            if (!hasAnyCol) {
                int n = monthly ? 6 : 4;
                for (int i = 0; i < n; i++) colNms[i] = monthly ? ((i + 1) + "월") : ("항목" + (i + 1));
            }
            int colCnt = 0;
            for (String c : colNms) if (c != null && !c.isBlank()) colCnt++;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rows = (List<Map<String, Object>>) chart.get("rows");
            for (Map<String, Object> row : rows) {
                Double[] vals = new Double[MAX_COLS];
                /* 시리즈마다 기준값을 다르게 잡아 시리즈 간 차이가 보이게 한다 */
                int base = ThreadLocalRandom.current().nextInt(50, 500);
                for (int i = 0; i < colCnt; i++) {
                    double jitter = ThreadLocalRandom.current().nextDouble(0.6, 1.4);
                    vals[i] = (double) Math.round(base * jitter);
                }
                row.put("vals", vals);
            }
        }
        return grids;
    }

    /* ── 내부 헬퍼 ────────────────────────────────────────────────────────── */

    /**
     * 기준조건에 맞는 저장 행 조회.
     *
     * <p>사이트·기간·차트는 DB 에서 거르고, 상품·업체는 여기서 거른다.
     * <b>지정하지 않은 상품·업체 = 그 차원으로 나누지 않은 행(컬럼 NULL)</b> 이라는 규칙이라
     * 단순 동등비교가 아니라 "둘 다 NULL 이거나 값이 같거나" 로 판정해야 한다.
     * 이렇게 해야 전사 합계 행과 특정 상품 행이 같은 그리드에 섞이지 않는다.</p>
     */
    private List<CmDashboardItemData> findRows(String siteId, String yyyymmdd, List<String> itemIds,
                                               String prodId, String vendorId) {
        if (itemIds == null || itemIds.isEmpty()) return List.of();
        String pId = blankToNull(prodId);
        String vId = blankToNull(vendorId);
        return dataRepository
            .findBySiteIdAndYyyymmddAndDashboardItemIdInOrderByDashboardItemIdAscItemKeyAsc(
                siteId, yyyymmdd, itemIds)
            .stream()
            .filter(d -> java.util.Objects.equals(blankToNull(d.getProdId()), pId))
            .filter(d -> java.util.Objects.equals(blankToNull(d.getVendorId()), vId))
            .toList();
    }

    /** 사이트·기간은 화면에서도 필수지만, 직접 호출/재현 대비로 서버에서도 막는다 */
    private void requireCond(String siteId, String yyyymmdd) {
        if (siteId == null || siteId.isBlank())
            throw new CmBizException("사이트는 필수 조건입니다.::" + CmUtil.svcCallerInfo(this));
        if (yyyymmdd == null || yyyymmdd.isBlank())
            throw new CmBizException("일자(또는 월)는 필수 조건입니다.::" + CmUtil.svcCallerInfo(this));
    }


    private void readColNms(CmDashboardItemData d, String[] out) {
        out[0] = d.getCol1Nm(); out[1] = d.getCol2Nm(); out[2] = d.getCol3Nm();
        out[3] = d.getCol4Nm(); out[4] = d.getCol5Nm(); out[5] = d.getCol6Nm();
        out[6] = d.getCol7Nm(); out[7] = d.getCol8Nm(); out[8] = d.getCol9Nm();
    }

    private Double[] readVals(CmDashboardItemData d) {
        Double[] v = new Double[MAX_COLS];
        if (d == null) return v;
        v[0] = d.getCol1Num(); v[1] = d.getCol2Num(); v[2] = d.getCol3Num();
        v[3] = d.getCol4Num(); v[4] = d.getCol5Num(); v[5] = d.getCol6Num();
        v[6] = d.getCol7Num(); v[7] = d.getCol8Num(); v[8] = d.getCol9Num();
        return v;
    }

    private void writeColNms(CmDashboardItemData e, List<?> colNms) {
        e.setCol1Nm(colAt(colNms, 0)); e.setCol2Nm(colAt(colNms, 1)); e.setCol3Nm(colAt(colNms, 2));
        e.setCol4Nm(colAt(colNms, 3)); e.setCol5Nm(colAt(colNms, 4)); e.setCol6Nm(colAt(colNms, 5));
        e.setCol7Nm(colAt(colNms, 6)); e.setCol8Nm(colAt(colNms, 7)); e.setCol9Nm(colAt(colNms, 8));
    }

    private void writeVals(CmDashboardItemData e, List<?> vals) {
        e.setCol1Num(numAt(vals, 0)); e.setCol2Num(numAt(vals, 1)); e.setCol3Num(numAt(vals, 2));
        e.setCol4Num(numAt(vals, 3)); e.setCol5Num(numAt(vals, 4)); e.setCol6Num(numAt(vals, 5));
        e.setCol7Num(numAt(vals, 6)); e.setCol8Num(numAt(vals, 7)); e.setCol9Num(numAt(vals, 8));
    }

    private static String colAt(List<?> list, int i) {
        if (list == null || i >= list.size() || list.get(i) == null) return null;
        String s = String.valueOf(list.get(i)).trim();
        return s.isBlank() ? null : s;
    }

    private static Double numAt(List<?> list, int i) {
        if (list == null || i >= list.size() || list.get(i) == null) return null;
        String s = String.valueOf(list.get(i)).trim();
        if (s.isBlank()) return null;
        try { return Double.valueOf(s); } catch (NumberFormatException e) { return null; }
    }

    private static boolean isAllEmpty(List<?> vals) {
        if (vals == null) return true;
        for (Object v : vals) {
            if (v == null) continue;
            if (!String.valueOf(v).trim().isBlank()) return false;
        }
        return true;
    }

    private static List<?> asList(Object o) { return o instanceof List<?> l ? l : List.of(); }
    private static String str(Object o) { return o == null ? null : String.valueOf(o); }
    private static String nvl(String s) { return s == null ? "" : s; }
    private static String nvlStr(String s, String def) { return s == null || s.isBlank() ? def : s; }
    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s; }
}
