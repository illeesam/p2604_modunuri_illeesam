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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
        List<CmDashboardItem> items = itemRepository.findByDashboardIdOrderBySortOrdAsc(dashboardId);
        List<Map<String, Object>> out = new ArrayList<>();

        for (CmDashboardItem it : items) {
            String chartCd = nvlStr(it.getItemKey(), "");
            out.add(node(1, chartCd, chartCd, it.getItemNm(), it, null));

            /* KPI/목록형은 시리즈·항목 개념이 없다 — 차트만 한 줄 */
            if (!"CHART".equals(it.getItemTypeCd())) continue;

            List<Map<String, String>> series = parseNodes(it.getSeriesJson(), it.getDashboardItemId(), "series_json");
            List<Map<String, String>> cols   = parseNodes(it.getColsJson(),   it.getDashboardItemId(), "cols_json");

            for (Map<String, String> s : series) {
                String sCd = nvlStr(s.get("cd"), s.get("name"));
                String sCode = join(chartCd, sCd);
                out.add(node(2, sCd, sCode, s.get("name"), it, null));
                for (Map<String, String> c : cols) {
                    String cCd = nvlStr(c.get("cd"), c.get("name"));
                    out.add(node(3, cCd, join(sCode, cCd), c.get("name"), it, sCd));
                }
            }
        }
        return out;
    }

    private Map<String, Object> node(int lvl, String cd, String itemCode, String nm,
                                     CmDashboardItem it, String parentSeriesCd) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("lvl", lvl);
        m.put("itemCd", cd);
        m.put("itemCode", itemCode);      /* 레벨 코드를 이어 만든 고유 코드 */
        m.put("itemNm", nm);
        m.put("dashboardItemId", it.getDashboardItemId());
        m.put("parentSeriesCd", parentSeriesCd);
        if (lvl == 1) {
            m.put("itemTypeCd",  it.getItemTypeCd());
            m.put("chartTypeCd", it.getChartTypeCd());
            m.put("useYn",       it.getUseYn());
            m.put("sortOrd",     it.getSortOrd());
            m.put("lvl1CodeGrp", it.getLvl1CodeGrp());
            m.put("lvl2CodeGrp", it.getLvl2CodeGrp());
        }
        return m;
    }

    /** {@code [{cd,name},...]} JSON 파싱. 깨져 있어도 화면은 떠야 하므로 빈 목록으로 폴백 */
    private List<Map<String, String>> parseNodes(String json, String itemId, String field) {
        if (json == null || json.isBlank()) return List.of();
        try {
            JsonNode arr = OM.readTree(json);
            if (!arr.isArray()) return List.of();
            List<Map<String, String>> out = new ArrayList<>();
            for (JsonNode n : arr) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("cd",   n.hasNonNull("cd")   ? n.get("cd").asText()   : null);
                m.put("name", n.hasNonNull("name") ? n.get("name").asText() : "");
                out.add(m);
            }
            return out;
        } catch (Exception e) {
            log.warn("[대시보드항목트리] {} 파싱 실패 itemId={} : {}", field, itemId, e.getMessage());
            return List.of();
        }
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

        List<CmDashboardItem> items = itemRepository
            .findByDashboardIdAndUseYnOrderBySortOrdAsc(dashboardId, "Y").stream()
            .filter(it -> "CHART".equals(it.getItemTypeCd()))
            .toList();

        List<String> itemIds = items.stream().map(CmDashboardItem::getDashboardItemId).toList();
        List<CmDashboardItemData> saved = findRows(siteId, yyyymmdd, itemIds, prodId, vendorId);

        /* 차트별로 저장된 행을 모아둔다 — 시리즈명(2레벨)이 키 */
        Map<String, Map<String, CmDashboardItemData>> byItem = new LinkedHashMap<>();
        for (CmDashboardItemData d : saved) {
            byItem.computeIfAbsent(d.getDashboardItemId(), k -> new LinkedHashMap<>())
                  .put(nvl(d.getSeriesNm()), d);
        }

        List<Map<String, Object>> charts = new ArrayList<>();
        for (CmDashboardItem it : items) {
            Map<String, CmDashboardItemData> rowsSaved =
                byItem.getOrDefault(it.getDashboardItemId(), Map.of());

            /* 3레벨(열 제목) — 차트 정의(cols_json)가 있으면 그것이 기준이다.
               정의가 없는 구형 차트만 저장된 데이터 행의 colN_nm 을 그대로 쓴다(하위호환). */
            List<Map<String, String>> colDefs = parseNodes(it.getColsJson(), it.getDashboardItemId(), "cols_json");
            String[] colNms = new String[MAX_COLS];
            String[] colCds = new String[MAX_COLS];
            if (!colDefs.isEmpty()) {
                for (int i = 0; i < Math.min(colDefs.size(), MAX_COLS); i++) {
                    colNms[i] = colDefs.get(i).get("name");
                    colCds[i] = colDefs.get(i).get("cd");
                }
            } else {
                rowsSaved.values().stream().findFirst().ifPresent(d -> readColNms(d, colNms));
            }

            String chartCd = nvlStr(it.getItemKey(), "");
            List<Map<String, String>> seriesDefs = parseNodes(it.getSeriesJson(), it.getDashboardItemId(), "series_json");

            List<Map<String, Object>> rows = new ArrayList<>();
            for (String seriesNm : seriesNamesOf(it)) {
                CmDashboardItemData d = rowsSaved.get(seriesNm);
                /* 시리즈 코드 — 정의에서 이름으로 찾고, 없으면 이름 자체를 코드로 */
                String sCd = seriesDefs.stream()
                    .filter(s -> seriesNm.equals(s.get("name")))
                    .map(s -> nvlStr(s.get("cd"), s.get("name")))
                    .findFirst().orElse(seriesNm);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("dashboardItemDataId", d != null ? d.getDashboardItemDataId() : null);
                row.put("seriesNm", seriesNm);
                row.put("seriesCd", sCd);
                row.put("itemCode", join(chartCd, sCd));   /* 이 행의 고유 코드 */
                row.put("vals", readVals(d));
                rows.add(row);
            }

            Map<String, Object> chart = new LinkedHashMap<>();
            chart.put("dashboardItemId", it.getDashboardItemId());
            chart.put("itemKey",         it.getItemKey());
            chart.put("itemNm",          it.getItemNm());
            chart.put("chartTypeCd",     it.getChartTypeCd());
            chart.put("colNms",          colNms);
            chart.put("colCds",          colCds);
            chart.put("colsFixed",       !colDefs.isEmpty());  /* true=정의 기준(열 제목 편집 불가) */
            chart.put("rows",            rows);
            charts.add(chart);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("charts", charts);
        return result;
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

        int saved = 0;
        for (Map<String, Object> chart : charts == null ? List.<Map<String, Object>>of() : charts) {
            String itemId = str(chart.get("dashboardItemId"));
            if (itemId == null) continue;
            CmDashboardItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 차트입니다: " + itemId));

            List<?> colNms = asList(chart.get("colNms"));
            List<?> rows   = asList(chart.get("rows"));

            /* 이 기준조건 + 이 차트의 기존 행을 미리 읽어 시리즈명으로 찾아 쓴다 */
            Map<String, CmDashboardItemData> existing = new LinkedHashMap<>();
            for (CmDashboardItemData d : findRows(siteId, yyyymmdd, List.of(itemId), pId, vId)) {
                existing.put(nvl(d.getSeriesNm()), d);
            }

            for (Object rowObj : rows) {
                if (!(rowObj instanceof Map<?, ?> row)) continue;
                String seriesNm = nvl(str(row.get("seriesNm")));
                List<?> vals = asList(row.get("vals"));
                if (isAllEmpty(vals)) continue;   /* 값 없는 시리즈는 행을 만들지 않는다 */

                CmDashboardItemData e = existing.get(seriesNm);
                if (e == null) {
                    e = new CmDashboardItemData();
                    e.setDashboardItemDataId(CmUtil.generateId("cm_dashboard_item_data"));
                    e.setRegBy(authId);
                    e.setRegDate(now);
                }
                e.setDashboardItemId(itemId);
                e.setUiNm(nvlStr(item.getItemNm(), "-"));      /* NOT NULL 역정규화 컬럼 */
                e.setItemKey(nvlStr(item.getItemKey(), "-"));  /* NOT NULL 역정규화 컬럼 */
                e.setSiteId(siteId);
                e.setYyyymmdd(yyyymmdd);
                e.setPeriodTypeCd("M".equals(periodTypeCd) ? "M" : "D");
                e.setProdId(pId);
                e.setVendorId(vId);
                e.setSeriesNm(seriesNm.isBlank() ? null : seriesNm);
                String sCd = str(row.get("seriesCd"));
                e.setSeriesCd(sCd == null || sCd.isBlank() ? null : sCd);
                writeColNms(e, colNms);
                writeVals(e, vals);
                e.setUpdBy(authId);
                e.setUpdDate(now);
                dataRepository.save(e);
                saved++;
            }
        }
        em.flush();
        return saved;
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
            .findBySiteIdAndYyyymmddAndDashboardItemIdInOrderByDashboardItemIdAscSeriesNmAsc(
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

    /** 차트의 series_json 에서 시리즈명(2레벨) 목록을 뽑는다. 없으면 단일 시리즈("") */
    private List<String> seriesNamesOf(CmDashboardItem item) {
        String json = item.getSeriesJson();
        if (json == null || json.isBlank()) return List.of("");
        try {
            JsonNode node = OM.readTree(json);
            if (!node.isArray() || node.isEmpty()) return List.of("");
            List<String> names = new ArrayList<>();
            for (JsonNode n : node) {
                JsonNode nm = n.get("name");
                names.add(nm != null && nm.isTextual() ? nm.asText() : "");
            }
            return names.isEmpty() ? List.of("") : names;
        } catch (Exception e) {
            /* 시리즈 정의가 깨져 있어도 화면은 떠야 한다 — 단일 시리즈로 폴백 */
            log.warn("[대시보드데이터] series_json 파싱 실패 itemId={} : {}", item.getDashboardItemId(), e.getMessage());
            return List.of("");
        }
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
