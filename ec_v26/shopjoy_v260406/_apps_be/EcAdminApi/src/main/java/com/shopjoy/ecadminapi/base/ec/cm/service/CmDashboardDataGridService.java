package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardWidgetRow;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.common.data.BasePage;
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
import java.util.HashMap;
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
 *   1레벨 차트   cm_dashboard_item (item_type_cd='chart')   → 그리드 1개
 *   2레벨 시리즈 cm_dashboard_item (item_type_cd='series')  → 그리드의 행 제목
 *   3레벨 항목   cm_dashboard_item (item_type_cd='item')    → 그리드의 열 제목
 * </pre>
 *
 * <p>값은 <b>항상 3레벨(항목) 정의행에만</b> 붙는다({@code cm_dashboard_data.item_key} 는 언제나
 * {@code key_level=3} 인 행을 가리킨다) — 시리즈 축이 날짜(DATE)든 카테고리(CATEGORY)든 구조가
 * 같아, 값이 어디 붙는지 조회·저장 로직에서 분기할 필요가 없다.</p>
 *
 * <p>기준조건은 사이트·기간이 필수, 상품·업체는 선택이다. 선택 조건을 지정하지 않으면
 * 해당 컬럼이 NULL 인 행(=그 차원으로 나누지 않은 전체 집계)만 대상으로 한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardDataGridService {

    /** 한 행에서 가로로 펼칠 수 있는 3레벨 항목 최대 개수 */
    public static final int MAX_COLS = 9;

    /** input_opts 미지정 시 기본값 — 날짜 토큰명(yyyy/yyyymm/yyyymmdd) 자체가 기간구분을 겸한다
     *  (2026-08-21 개편, {@code period_type_cd:M} 같은 별도 토큰 폐기) */
    public static final String DEFAULT_INPUT_OPTS = "site_id,yyyymm";

    private final CmDashboardItemRepository itemRepository;
    private final CmDashboardDataRepository dataRepository;

    @PersistenceContext
    private EntityManager em;

    /* ── 항목 목록 3레벨 트리 ──────────────────────────────────────────────── */

    /**
     * 대시보드의 항목 구조를 3레벨 평면 트리로 만든다 (항목관리 화면의 "항목 목록").
     *
     * <p>고유 코드({@code itemKey})는 레벨 코드를 {@code -} 로 이어 만든다 — 중간 레벨 코드가
     * 바뀌면 하위가 자동으로 따라오고, 같은 값을 두 곳에 저장해 어긋날 일이 없다.
     * 예: {@code chart001-series01-item01}</p>
     *
     * <p>트리는 화면에서 들여쓰기로 그리기 쉽도록 <b>평면 배열</b>로 돌려준다(부모 중첩 아님).
     * 각 노드는 {@code lvl}(1|2|3) 과 {@code itemKey} 를 갖는다.</p>
     */
    public List<Map<String, Object>> getItemTree(String dashboardId) {
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

    /**
     * 항목관리 화면 "대시보드 위젯항목 목록" 서버사이드 페이징 — 차트(1레벨) 단위.
     *
     * <p>{@code selectChartPage} 가 돌려준 이번 페이지 차트들에 한해서만 시리즈·항목을
     * 채워({@code attachChildren}) 반환한다 — 페이지에 없는 차트의 하위행까지 매번 다 읽어올
     * 필요가 없다(기존 "전체 로드 후 클라이언트 슬라이스" 방식의 성능 문제를 해소하는 게 목적).</p>
     */
    public BasePage<CmDashboardItem> getChartPage(Map<String, Object> p) {
        BasePage<CmDashboardItem> page = itemRepository.selectChartPage(p);
        List<CmDashboardItem> charts = page.getPageList();
        List<CmDashboardItem> all = new ArrayList<>(charts);
        for (CmDashboardItem ch : charts) all.addAll(descendantsOf(ch));
        attachChildren(charts, all);
        return page;
    }

    /**
     * 특정 차트들(dashboardItemId 목록)의 3레벨 트리를 조립한다 — {@link #getItemTree(String)} 의
     * "차트 지정" 버전. 서버사이드 페이징으로 이번 페이지에 뜬 차트만 트리를 채울 때 쓴다.
     * 반환 순서는 입력한 {@code chartIds} 순서(=페이지 정렬 순서)를 그대로 따른다.
     */
    public List<Map<String, Object>> getItemTreeByChartIds(List<String> chartIds) {
        if (chartIds == null || chartIds.isEmpty()) return List.of();
        Map<String, CmDashboardItem> chartById = new LinkedHashMap<>();
        itemRepository.findAllById(chartIds).forEach(c -> chartById.put(c.getDashboardItemId(), c));
        List<CmDashboardItem> ordered = chartIds.stream()
            .map(chartById::get).filter(java.util.Objects::nonNull).toList();

        Comparator<CmDashboardItem> bySort =
            Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());

        List<Map<String, Object>> out = new ArrayList<>();
        for (CmDashboardItem ch : ordered) {
            Map<String, Object> chNode = treeNode(1, ch);
            chNode.put("dashboardId", ch.getDashboardId());
            out.add(chNode);
            List<CmDashboardItem> sers = new ArrayList<>(itemRepository.findByParentDashboardItemId(ch.getDashboardItemId()));
            sers.sort(bySort);
            for (CmDashboardItem se : sers) {
                out.add(treeNode(2, se));
                List<CmDashboardItem> items = new ArrayList<>(itemRepository.findByParentDashboardItemId(se.getDashboardItemId()));
                items.sort(bySort);
                for (CmDashboardItem it : items) out.add(treeNode(3, it));
            }
        }
        return out;
    }

    /** 화면이 쓰는 최소 정보만 */
    private static Map<String, Object> brief(CmDashboardItem it) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dashboardItemId", it.getDashboardItemId());
        m.put("itemKey", it.getItemKey());
        m.put("cd", it.getKeyNm());
        m.put("name", it.getItemNm());
        /* 시리즈(2레벨)는 lvl2_color, 항목(3레벨)은 lvl3_color — brief() 는 두 레벨 모두에서
           호출되므로(attachChildren 의 series/cols 매핑) keyLevel 로 갈라 낸다(2026-08-21) */
        m.put("color", Integer.valueOf(3).equals(it.getKeyLevel()) ? it.getLvl3Color() : it.getLvl2Color());
        return m;
    }

    /* ── 하위 정의행 동기화 (항목관리 저장) ───────────────────────────────── */

    /**
     * 차트의 시리즈·항목 편집 결과를 실제 정의행으로 반영한다.
     *
     * <p>화면은 시리즈/항목을 그리드로 편집하지만 조회·연동의 기준은 어디까지나 <b>행</b>이므로,
     * 저장 시 여기서 하위 행을 만들고/고치고/지워 트리와 화면을 일치시킨다.</p>
     *
     * <p>기준은 조립코드({@code item_key})다 — 이름을 바꿔도 코드가 같으면 같은 행으로 보고
     * 갱신하므로, 붙어 있던 데이터가 끊기지 않는다. 반대로 코드가 사라지면 그 행과
     * <b>거기 붙어 있던 데이터까지</b> 지운다(값이 놓일 자리가 없어지므로).</p>
     *
     * <p>축 유형(DATE/CATEGORY)은 여기서 더 이상 분기하지 않는다 — 값은 항상 3레벨(항목)에만
     * 붙으므로, 날짜축 차트도 카테고리축과 똑같이 항목행(예: m01~m12)을 둔다.</p>
     *
     * @param chartId       차트(1레벨) 정의행 ID
     * @param series        [{cd,name,color}] 순서가 곧 표시 순서
     * @param cols          [{cd,name}] — 시리즈 전체가 공유하는 3레벨 항목 1벌
     * @param cellOverrides key=조립 item_key(chart-series-item), value={autoCollectYn,editableYn,color} —
     *                      시리즈×항목 특정 셀 하나만 cols 의 공유값과 다르게 줄 때만 채운다(2026-08-21)
     */
    @Transactional
    public Map<String, Object> syncChildren(String chartId,
                                            List<Map<String, Object>> series,
                                            List<Map<String, Object>> cols,
                                            Map<String, Object> cellOverrides) {
        CmDashboardItem ch = itemRepository.findById(chartId)
            .orElseThrow(() -> new CmBizException("존재하지 않는 차트입니다: " + chartId));
        if (!"chart".equals(ch.getItemTypeCd()))
            throw new CmBizException("차트(1레벨) 행이 아닙니다: " + chartId);

        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        String chartCd = nvlStr(ch.getItemKey(), "");

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
                "series", ch.getDashboardId(), ch.getDashboardItemId(), chartCd, (si + 1) * 10, authId, now,
                str(sm.get("autoCollectYn")), str(sm.get("editableYn")));
            upSer++;

            for (int ci = 0; ci < colList.size(); ci++) {
                Map<String, Object> cm = colList.get(ci);
                String cCd = codeOf(cm, "item", ci);
                /* 열 정의는 시리즈 전체가 공유하는 1벌이라 cm 의 PK 는 특정 시리즈의 자식 하나만
                   가리킨다. 그 PK 로 다른 시리즈의 행까지 바꾸면 남의 코드를 덮어써 UNIQUE 가 깨진다.
                   그래서 PK 에서는 "옛 키명" 만 얻고, 실제 대상은 시리즈별 조립코드로 찾는다. */
                String cOldCd = colOldCds.get(ci);
                String itemKey = sCode + "-" + cCd;
                if (cOldCd != null)
                    renameByCode(exist, sCode + "-" + cOldCd, itemKey, cCd);
                /* 셀 오버라이드 — 이 시리즈×항목 조합만 cols 의 공유값과 다르게 지정됐으면 그 값을,
                   없으면 기존처럼 cols(항목 1벌 공유값)를 쓴다(2026-08-21) */
                @SuppressWarnings("unchecked")
                Map<String, Object> ov = cellOverrides != null && cellOverrides.get(itemKey) instanceof Map
                    ? (Map<String, Object>) cellOverrides.get(itemKey) : null;
                String cellColor = (ov != null && ov.get("color") != null) ? str(ov.get("color")) : str(cm.get("color"));
                String cellAuto  = (ov != null && ov.get("autoCollectYn") != null) ? str(ov.get("autoCollectYn")) : str(cm.get("autoCollectYn"));
                String cellEdit  = (ov != null && ov.get("editableYn") != null) ? str(ov.get("editableYn")) : str(cm.get("editableYn"));
                putRow(exist, keep, itemKey, cCd, str(cm.get("name")), cellColor,
                    "item", ch.getDashboardId(), se.getDashboardItemId(), sCode, (ci + 1) * 10, authId, now,
                    cellAuto, cellEdit);
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

    /* ── 쿼리방식(QUERY) 위젯 생성 ────────────────────────────────────────── */

    private static final java.util.regex.Pattern FORBIDDEN_SQL = java.util.regex.Pattern.compile(
        "(?i)\\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|exec|execute|call|merge|copy|vacuum)\\b|--|/\\*");

    /**
     * 쿼리방식(QUERY) 위젯 생성 — chart.gen_query 를 실행한 결과로 시리즈·항목·값을 채운다.
     *
     * <p>결과는 반드시 {@code series_cd, series_nm, item_cd, item_nm, val_num} 다섯 컬럼을
     * 이 순서로 내려줘야 한다(이름이 아니라 순번으로 읽는다). 관리자가 직접 SQL 을 적는
     * 기능이라 안전장치를 우선한다 — SELECT 단문만 허용(DML/DDL/주석 키워드 있으면 거부),
     * 결과는 500행으로 강제로 자르고, 5초 넘게 걸리면 타임아웃시킨다.</p>
     *
     * <p>쿼리로 만들어진 시리즈·항목은 자동수집(Y)·수정불가(N)로 표시된다 — 데이터관리
     * 화면에서 손으로 고치는 대상이 아니라 쿼리를 다시 실행해서 갱신하는 대상이기 때문이다.</p>
     */
    @Transactional
    public Map<String, Object> generateFromQuery(String chartId, String siteId, String yyyymmdd) {
        CmDashboardItem ch = itemRepository.findById(chartId)
            .orElseThrow(() -> new CmBizException("존재하지 않는 차트입니다: " + chartId));
        if (!"chart".equals(ch.getItemTypeCd()))
            throw new CmBizException("차트(1레벨) 행이 아닙니다: " + chartId);
        if (!"QUERY".equals(ch.getWidgetGenTypeCd()))
            throw new CmBizException("이 위젯은 쿼리방식(QUERY)이 아닙니다: " + chartId);
        if (siteId == null || siteId.isBlank())
            throw new CmBizException("사이트를 지정해야 합니다.");
        String rawSql = nvlStr(ch.getGenQuery(), "");
        if (rawSql.isBlank()) throw new CmBizException("생성 쿼리(gen_query)가 비어 있습니다.");

        String trimmed = rawSql.trim();
        if (trimmed.endsWith(";")) trimmed = trimmed.substring(0, trimmed.length() - 1).trim();
        if (trimmed.contains(";"))
            throw new CmBizException("세미콜론으로 이어진 복수 문장은 허용하지 않습니다(SELECT 한 문장만).");
        if (!trimmed.regionMatches(true, 0, "select", 0, 6))
            throw new CmBizException("SELECT 문만 허용합니다.");
        if (FORBIDDEN_SQL.matcher(trimmed).find())
            throw new CmBizException("허용되지 않는 키워드가 포함되어 있습니다(DML/DDL/주석 등).");

        /* :siteId, :yyyymmdd, :yyyymm 플레이스홀더 치환 — 관리자가 작성한 신뢰 SQL 이므로
           단순 문자열 치환으로 충분하다. 기준일자를 안 넘기면 오늘 날짜로 8자리 채워서 쓴다
           (yyyymmdd 는 항상 8자리 — D/M/Y 어느 기간구분이든 이 프로젝트 공통 관례) */
        String refYmd = (yyyymmdd == null || yyyymmdd.isBlank())
            ? java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
            : yyyymmdd.trim();
        if (!refYmd.matches("\\d{8}"))
            throw new CmBizException("기준일자는 8자리 숫자(YYYYMMDD)여야 합니다: " + refYmd);
        String sql = trimmed
            .replace(":siteId", "'" + siteId.replace("'", "''") + "'")
            .replace(":yyyymmdd", "'" + refYmd + "'")
            .replace(":yyyymm", "'" + refYmd.substring(0, 6) + "'");
        /* 사용자가 LIMIT 을 안 넣었어도 여기서 500행으로 강제로 자른다 */
        String wrapped = "SELECT * FROM (" + sql + ") gen_query_t LIMIT 500";

        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        String chartCd = nvlStr(ch.getItemKey(), "");

        /* JPA em.createNativeQuery() 는 내부적으로 Hibernate 네임드파라미터 파서를 거치는데,
           이 파서가 PostgreSQL 캐스트 연산자 "::int" 를 콜론+식별자(":int")로 오인식해
           콜론 하나를 삼켜버리는 문제가 있다(관리자가 작성한 SQL에 ::캐스트가 매우 흔함).
           그래서 이 구간만 Hibernate 파서를 우회하는 순수 JDBC Statement 로 직접 실행한다. */
        List<Object[]> rawRows = new ArrayList<>();
        try {
            org.hibernate.Session session = em.unwrap(org.hibernate.Session.class);
            session.doWork(conn -> {
                try (java.sql.Statement st = conn.createStatement()) {
                    st.setQueryTimeout(5);
                    try (java.sql.ResultSet rs = st.executeQuery(wrapped)) {
                        int colCount = rs.getMetaData().getColumnCount();
                        while (rs.next()) {
                            Object[] row = new Object[colCount];
                            for (int i = 0; i < colCount; i++) row[i] = rs.getObject(i + 1);
                            rawRows.add(row);
                        }
                    }
                }
            });
        } catch (Exception e) {
            throw new CmBizException("쿼리 실행 오류: " + e.getMessage());
        }
        if (rawRows.isEmpty()) throw new CmBizException("쿼리 결과가 없습니다.");

        Map<String, CmDashboardItem> exist = new LinkedHashMap<>();
        for (CmDashboardItem d : descendantsOf(ch)) exist.put(d.getItemKey(), d);
        Set<String> keep = new LinkedHashSet<>();

        /* 이번 실행 결과는 전부 "같은 스냅샷" 이다 — chart036 월별 백필(연도마다 12개월 항목이
           전부 같은 yyyymmdd 태그를 공유)과 동일한 패턴. 항목마다 따로 계산하면(예: 연도별
           차트에서 "2024년" 항목에 yyyymmdd=20240000 을 매기는 식) 조회 시 딱 그 항목 하나만
           우연히 걸리고 나머지는 안 보이는 버그가 난다 — 그래서 실행 전체에서 딱 한 번만
           기준일자(refYmd) 로 정하고, 이번에 갱신되는 모든 시리즈·항목 값이 이 태그 하나를 같이 쓴다. */
        String[] runPeriod = deriveRunPeriodFromInputOpts(nvlStr(ch.getInputOpts(), ""), refYmd);

        Map<String, Integer> seriesOrd = new LinkedHashMap<>();
        Map<String, Integer> itemOrd = new LinkedHashMap<>();
        int upSer = 0, upItm = 0, upVal = 0;

        for (Object[] r : rawRows) {
            String seriesCd = str(r[0]);
            String seriesNm = str(r[1]);
            String itemCd   = str(r[2]);
            String itemNm   = str(r[3]);
            Double val      = r.length > 4 ? toDouble(r[4]) : null;
            if (seriesCd == null || itemCd == null) continue;

            seriesOrd.putIfAbsent(seriesCd, (seriesOrd.size() + 1) * 10);
            String sCode = chartCd + "-" + seriesCd;
            CmDashboardItem se = putRow(exist, keep, sCode, seriesCd, seriesNm, null,
                "series", ch.getDashboardId(), ch.getDashboardItemId(), chartCd,
                seriesOrd.get(seriesCd), authId, now, "Y", "N");
            upSer++;

            String ordKey = seriesCd + "|" + itemCd;
            itemOrd.putIfAbsent(ordKey, (itemOrd.size() + 1) * 10);
            String itemKey = sCode + "-" + itemCd;
            CmDashboardItem it = putRow(exist, keep, itemKey, itemCd, itemNm, null,
                "item", ch.getDashboardId(), se.getDashboardItemId(), sCode,
                itemOrd.get(ordKey), authId, now, "Y", "N");
            upItm++;

            if (val != null) {
                CmDashboardData e = upsert(it.getDashboardItemId(), siteId, runPeriod[0], runPeriod[1], null, null, ch, authId, now);
                e.setDataVal(val);
                dataRepository.save(e);
                upVal++;
            }
        }
        /* 남은 것 = 이번 쿼리 결과에 없는 옛 시리즈·항목(예: 매뉴얼 시절 잔재, 쿼리 변경으로
           사라진 코드) → 붙어있던 데이터까지 함께 정리한다(syncChildren 과 동일한 정책) */
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
        out.put("values", upVal);
        out.put("deletedRows", delRow);
        out.put("deletedValues", delData);
        return out;
    }

    /**
     * 쿼리방식 실행 전체가 공유할 (yyyymmdd, periodTypeCd) 를 차트의 input_opts 기간 토큰과
     * 기준일자(refYmd) 로 정한다. {@code cm_dashboard_data.yyyymmdd} 는 NOT NULL 이므로 항상
     * 8자리 값을 채워야 한다(D=YYYYMMDD/M=YYYYMM00/Y=YYYY0000 — 프로젝트 공통 관례).
     * 기간 토큰이 없는 차트(상품/업체별 등)는 기준일자를 "as of" 스냅샷으로 그대로 채우고
     * periodTypeCd 는 null 로 둔다. 항목코드별로 따로 계산하지 않는다 — 한 실행 결과는
     * 통째로 하나의 스냅샷이다(위 호출부 주석 참고).
     */
    private String[] deriveRunPeriodFromInputOpts(String inputOpts, String refYmd) {
        Set<String> tokens = new LinkedHashSet<>(List.of(inputOpts.split(",")));
        if (tokens.contains("yyyymmdd")) return new String[]{refYmd, "D"};
        if (tokens.contains("yyyymm"))   return new String[]{refYmd.substring(0, 6) + "00", "M"};
        if (tokens.contains("yyyy"))     return new String[]{refYmd.substring(0, 4) + "0000", "Y"};
        return new String[]{refYmd, null};
    }

    /**
     * 차트 아래 모든 시리즈·항목 행 — parent_dashboard_item_id 체인만으로 찾는다(대시보드ID 로
     * 좁히지 않는다). 방금 다른 대시보드로 옮긴 차트는 저장 순서상(차트 먼저 저장 → 그 다음
     * syncChildren 이 하위행 갱신) 이 시점엔 하위 시리즈·항목이 아직 옛 대시보드 소속이라,
     * dashboardId 로 좁혀서 찾으면 "없는 행"으로 오판해 새로 INSERT 하려다 item_key UNIQUE
     * 위반으로 500 이 난다(2026-08-21 발견). putRow() 가 바로 다음 줄에서 이 행들을 새
     * dashboardId 로 갱신한다.
     */
    private List<CmDashboardItem> descendantsOf(CmDashboardItem ch) {
        List<CmDashboardItem> sers = itemRepository.findByParentDashboardItemId(ch.getDashboardItemId());
        List<CmDashboardItem> out = new ArrayList<>();
        for (CmDashboardItem se : sers) {
            out.add(se);
            out.addAll(itemRepository.findByParentDashboardItemId(se.getDashboardItemId()));
        }
        return out;
    }

    /** 한 행 반영 — 코드가 있으면 갱신, 없으면 생성 */
    private CmDashboardItem putRow(Map<String, CmDashboardItem> exist, Set<String> keep,
                                   String itemCode, String ownCd, String nm, String color, String lvlCd,
                                   String dashboardId, String parentId, String parentCode,
                                   int sortOrd, String authId, LocalDateTime now,
                                   String autoCollectYn, String editableYn) {
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
        /* 색상은 레벨별로 다른 컬럼에 담는다 — 시리즈(2레벨)는 lvl2_color, 항목(3레벨)은
           lvl3_color. 차트(1레벨) 행은 색을 안 쓴다(2026-08-21, item_color 단일 컬럼에서 분리) */
        if ("series".equals(lvlCd)) row.setLvl2Color(blankToNull(color));
        else if ("item".equals(lvlCd)) row.setLvl3Color(blankToNull(color));
        row.setItemTypeCd(lvlCd);
        row.setKeyLevel("chart".equals(lvlCd) ? 1 : ("series".equals(lvlCd) ? 2 : 3));
        row.setKeyNm(ownCd);
        row.setParentDashboardItemId(parentId);
        row.setSortOrd(sortOrd);
        row.setUseYn("Y");
        /* 시리즈·항목(2·3레벨)도 자동수집/편집가능여부를 개별로 가질 수 있다 — 화면이 이 값을
           보내면 그대로 반영, 안 보내면(구 화면 호환) 기본값으로 둔다(2026-08-21) */
        row.setAutoCollectYn(nvlStr(autoCollectYn, "N"));
        row.setEditableYn(nvlStr(editableYn, "Y"));
        row.setUpdBy(authId);
        row.setUpdDate(now);
        CmDashboardItem saved = itemRepository.save(row);
        /* exist 맵을 바로 갱신 — 같은 실행 안에서 같은 코드가 또 나오면(예: 쿼리방식 결과가
           한 시리즈에 항목을 여럿 반환하는 보통의 경우) 두 번째부터도 방금 만든 이 행을
           "이미 있음" 으로 찾아 UPDATE 해야 한다. 갱신을 안 하면 매번 새 행으로 오판해
           item_key UNIQUE 위반(중복 INSERT)이 난다(2026-08-21 발견 — generateFromQuery 가
           시리즈 하나에 항목을 여러 개 반환할 때마다 재현됨). */
        exist.put(itemCode, saved);
        return saved;
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
     * 거기 붙어 있던 {@code cm_dashboard_data.item_key} 까지 함께 갱신한다.
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

    /** 트리 노드 1개 — 화면은 lvl 로 들여쓰고 itemKey 로 식별한다 */
    private Map<String, Object> treeNode(int lvl, CmDashboardItem it) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("lvl", lvl);
        m.put("dashboardItemId", it.getDashboardItemId());
        m.put("parentDashboardItemId", it.getParentDashboardItemId());
        m.put("itemKey", it.getItemKey());
        m.put("itemCd", lastSeg(it.getItemKey()));
        m.put("itemNm", it.getItemNm());
        m.put("lvl2Color", it.getLvl2Color());
        m.put("lvl3Color", it.getLvl3Color());
        m.put("sortOrd", it.getSortOrd());
        m.put("useYn", it.getUseYn());
        /* 자동수집/편집가능여부는 2·3레벨(시리즈/항목)도 개별로 가질 수 있다 — 실제 배치가
           채우는 건 보통 "이번 달" 항목 하나뿐이라 1레벨(차트) 전체를 잠그면 과하다(2026-08-21).
           그래서 레벨 제한 없이 항상 내려준다. */
        m.put("autoCollectYn", nvlStr(it.getAutoCollectYn(), "N"));
        m.put("editableYn",    nvlStr(it.getEditableYn(), "Y"));
        if (lvl == 1) {
            m.put("itemTypeCd",  it.getItemTypeCd());
            m.put("widgetTypeCd", it.getWidgetTypeCd());
            m.put("chartTypeCd", it.getChartTypeCd());
            m.put("axisTypeCd",  it.getAxisTypeCd());
            m.put("seriesOrientCd", nvlStr(it.getSeriesOrientCd(), "ROW"));
            m.put("inputOpts",     nvlStr(it.getInputOpts(), DEFAULT_INPUT_OPTS));
            m.put("lvl1CodeGrp", it.getLvl1CodeGrp());
            m.put("lvl2CodeGrp", it.getLvl2CodeGrp());
            m.put("widgetGenTypeCd", nvlStr(it.getWidgetGenTypeCd(), "MANUAL"));
            m.put("genQuery",    it.getGenQuery());
            m.put("refItemKey",  it.getRefItemKey());
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
     * <p>차원이 늘어도 컬럼을 새로 만들 필요가 없고, {@code (item_key, data_opts)} 가
     * UNIQUE 라 같은 좌표가 다시 들어오면 새 행 대신 그 행을 갱신하면 된다.</p>
     */
    public static String buildOptions(CmDashboardData d) {
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

    /* ── 조회(편집 그리드) ────────────────────────────────────────────────── */

    /**
     * 기준조건에 해당하는 "차트별 그리드" 묶음을 만든다.
     *
     * @param dashboardId 대상 대시보드 (이 안의 CHART 항목들만 그리드로 만든다)
     * @param siteId      사이트ID (필수)
     * @param yyyymmdd    기간 키 — 컬럼 자체는 항상 8자리. D=YYYYMMDD / M=YYYYMM00 / Y=YYYY0000 로 0-패딩(필수)
     * @param prodId      상품ID (선택, null 이면 상품 미지정 행)
     * @param vendorId    업체ID (선택, null 이면 업체 미지정 행)
     * @return charts: [{dashboardItemId, itemNm, chartTypeCd, colNms[], rows:[{seriesNm, vals[]}]}]
     */
    public Map<String, Object> getGrids(String dashboardId, String siteId, String yyyymmdd,
                                        String prodId, String vendorId) {
        requireCond(siteId, yyyymmdd);
        List<CmDashboardItem> all = itemRepository.findByDashboardIdOrderBySortOrdAsc(dashboardId);
        Comparator<CmDashboardItem> bySort = Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());
        List<CmDashboardItem> charts0 = all.stream()
            .filter(it -> "chart".equals(it.getItemTypeCd()) && !"N".equals(it.getUseYn()))
            .sorted(bySort).toList();
        return buildGridResult(all, charts0, siteId, yyyymmdd, prodId, vendorId);
    }

    /**
     * 그리드 조회 — 서로 다른 대시보드에 걸친 차트도 한 번에 조회한다(2026-08-21).
     * '대시보드 데이타관리' 화면이 위젯을 input_opts(조회조건 구성) 별로 묶어 그룹 단위로
     * [조회]하는데, 그 그룹에 서로 다른 대시보드의 차트가 섞여 있을 수 있어(전체 대시보드
     * 목록에서 여러 대시보드 위젯을 함께 체크) dashboardId 하나로 좁히지 않고 정확한
     * 차트 dashboardItemId 목록을 그대로 받는다.
     *
     * @param chartIds 조회할 차트(1레벨) dashboardItemId 목록 — 요청 순서를 그대로 유지한다
     */
    public Map<String, Object> getGridsByCharts(List<String> chartIds, String siteId, String yyyymmdd,
                                                String prodId, String vendorId) {
        requireCond(siteId, yyyymmdd);
        if (chartIds == null || chartIds.isEmpty())
            throw new CmBizException("조회할 차트 목록이 비어 있습니다.");

        Map<String, CmDashboardItem> byId = new LinkedHashMap<>();
        itemRepository.findAllById(chartIds).forEach(it -> byId.put(it.getDashboardItemId(), it));
        List<CmDashboardItem> charts0 = chartIds.stream()
            .map(byId::get)
            .filter(it -> it != null && "chart".equals(it.getItemTypeCd()) && !"N".equals(it.getUseYn()))
            .toList();
        if (charts0.isEmpty())
            throw new CmBizException("조회할 수 있는 차트가 없습니다.");

        /* 이 차트들이 속한 대시보드 전체 트리를 모아 부모-자식(시리즈·항목) 관계를 파악한다 */
        Set<String> dashboardIds = new LinkedHashSet<>();
        charts0.forEach(ch -> dashboardIds.add(ch.getDashboardId()));
        List<CmDashboardItem> all = new ArrayList<>();
        for (String did : dashboardIds) all.addAll(itemRepository.findByDashboardIdOrderBySortOrdAsc(did));

        return buildGridResult(all, charts0, siteId, yyyymmdd, prodId, vendorId);
    }

    /** getGrids / getGridsByCharts 공용 — all(정의 트리 전체) + charts0(그릴 차트 목록)으로 그리드를 만든다 */
    private Map<String, Object> buildGridResult(List<CmDashboardItem> all, List<CmDashboardItem> charts0,
                                                String siteId, String yyyymmdd, String prodId, String vendorId) {
        Map<String, List<CmDashboardItem>> byParent = new LinkedHashMap<>();
        for (CmDashboardItem it : all) {
            if (!"chart".equals(it.getItemTypeCd()))
                byParent.computeIfAbsent(nvlStr(it.getParentDashboardItemId(), ""), k -> new ArrayList<>()).add(it);
        }
        Comparator<CmDashboardItem> bySort = Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());
        byParent.values().forEach(v -> v.sort(bySort));

        /* 값은 항상 3레벨(항목) 행에만 붙으므로 정의행 전체를 한 번에 읽어 매칭한다 */
        List<String> allIds = all.stream().map(CmDashboardItem::getDashboardItemId).toList();
        Map<String, CmDashboardData> valueOf = new LinkedHashMap<>();
        if (!allIds.isEmpty()) {
            for (CmDashboardData d : findRows(siteId, yyyymmdd, allIds, prodId, vendorId)) {
                valueOf.put(d.getDashboardItemId(), d);   /* (정의행, 좌표) 가 UNIQUE 라 1:1 */
            }
        }

        List<Map<String, Object>> charts = new ArrayList<>();
        for (CmDashboardItem ch : charts0) {
            List<CmDashboardItem> sers = byParent.getOrDefault(ch.getDashboardItemId(), List.of());

            /* 열(3레벨) — 첫 시리즈의 항목행이 곧 열 정의. 시리즈마다 같은 개수·순서로 둔다 */
            List<CmDashboardItem> cols0 = sers.isEmpty() ? List.<CmDashboardItem>of()
                : byParent.getOrDefault(sers.get(0).getDashboardItemId(), List.of());

            /* 행/열 방향 — series_orient_cd. 기본(ROW)은 시리즈가 행·항목이 열(기존 그대로).
               COL 이면 항목이 행·시리즈가 열로 뒤집는다(항목 수가 많고 시리즈가 적은 차트에 유용).
               셀 데이터 자체(어느 leaf 항목행에 값이 붙는지)는 방향과 무관하게 동일 — 여기서는
               그 leaf 를 (행,열) 어느 좌표에 배치할지만 바꾼다. */
            boolean colOrient = "COL".equals(ch.getSeriesOrientCd());
            List<CmDashboardItem> rowDefs = colOrient ? cols0 : sers;
            List<CmDashboardItem> colDefs = colOrient ? sers : cols0;

            String[] colNms = new String[MAX_COLS];
            String[] colCds = new String[MAX_COLS];
            for (int i2 = 0; i2 < Math.min(colDefs.size(), MAX_COLS); i2++) {
                colNms[i2] = colDefs.get(i2).getItemNm();
                colCds[i2] = lastSeg(colDefs.get(i2).getItemKey());
            }

            /* 시리즈별 항목(3레벨) 목록을 미리 모아둔다 — 방향과 무관하게 "셀 = (시리즈, 항목) leaf"
               를 찾는 데 공통으로 쓴다. 각 시리즈의 항목은 cols0 와 같은 순서·개수를 갖는다
               (syncChildren 이 열 정의 1벌을 모든 시리즈에 동일 적용하므로). */
            Map<String, List<CmDashboardItem>> itemsOfSeries = new LinkedHashMap<>();
            for (CmDashboardItem se : sers)
                itemsOfSeries.put(se.getDashboardItemId(), byParent.getOrDefault(se.getDashboardItemId(), List.of()));

            List<Map<String, Object>> rows = new ArrayList<>();
            for (int r = 0; r < rowDefs.size(); r++) {
                CmDashboardItem rowDef = rowDefs.get(r);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("dashboardItemId", rowDef.getDashboardItemId());
                row.put("seriesNm", rowDef.getItemNm());
                row.put("seriesCd", lastSeg(rowDef.getItemKey()));
                row.put("itemKey", rowDef.getItemKey());

                /* 셀 하나 = 항목(3레벨)행 하나 — 값은 그 행의 data_val.
                   자동수집여부는 원래 1레벨(차트) 설정뿐이었는데, 실제로 배치가 채우는 건 그
                   차트의 "이번 달" 셀 하나뿐이라 카드 전체를 자동수집으로 표시하면 과하다 —
                   3레벨(항목) 행에도 auto_collect_yn 을 개별로 둘 수 있게 셀 단위로 실어준다
                   (2026-08-21, 화면은 이 값 있는 셀에만 작은 배지를 단다). */
                List<Object> vals = new ArrayList<>();
                List<Object> cellIds = new ArrayList<>();
                List<Object> cellAutoCollect = new ArrayList<>();
                List<Object> cellEditable = new ArrayList<>();
                for (int c = 0; c < Math.min(colDefs.size(), MAX_COLS); c++) {
                    CmDashboardItem leaf;
                    if (colOrient) {
                        /* 행=항목(고정 위치 r), 열=시리즈 → 그 시리즈의 r번째 항목이 이 셀의 leaf */
                        List<CmDashboardItem> myItems = itemsOfSeries.getOrDefault(colDefs.get(c).getDashboardItemId(), List.of());
                        leaf = r < myItems.size() ? myItems.get(r) : null;
                    } else {
                        /* 행=시리즈(rowDef), 열=항목(고정 위치 c) → rowDef 시리즈의 c번째 항목 */
                        List<CmDashboardItem> myItems = itemsOfSeries.getOrDefault(rowDef.getDashboardItemId(), List.of());
                        leaf = c < myItems.size() ? myItems.get(c) : null;
                    }
                    CmDashboardData d = leaf != null ? valueOf.get(leaf.getDashboardItemId()) : null;
                    vals.add(d != null ? d.getDataVal() : null);
                    cellIds.add(leaf != null ? leaf.getDashboardItemId() : null);
                    cellAutoCollect.add(leaf != null && "Y".equals(leaf.getAutoCollectYn()));
                    /* 항목(3레벨) 자체는 editable_yn 미지정이 보통(Y 상속 의도)이므로 null 은 편집가능으로 본다 */
                    cellEditable.add(leaf == null || !"N".equals(leaf.getEditableYn()));
                }
                row.put("cellItemIds", cellIds);   /* 저장 시 셀->정의행 매핑에 쓴다 */
                row.put("vals", vals);
                row.put("cellAutoCollect", cellAutoCollect);   /* 셀별 자동수집 배지 표시용 */
                row.put("cellEditable", cellEditable);         /* 셀별 입력 잠금 — 차트 전체 editableYn 과 AND 로 적용 */
                rows.add(row);
            }

            Map<String, Object> chart = new LinkedHashMap<>();
            chart.put("dashboardItemId", ch.getDashboardItemId());
            chart.put("itemKey",        ch.getItemKey());
            chart.put("itemNm",          ch.getItemNm());
            chart.put("chartTypeCd",     ch.getChartTypeCd());
            chart.put("widgetTypeCd",    ch.getWidgetTypeCd());
            chart.put("axisTypeCd",      nvlStr(ch.getAxisTypeCd(), "CATEGORY"));
            chart.put("seriesOrientCd",  nvlStr(ch.getSeriesOrientCd(), "ROW"));
            chart.put("autoCollectYn",   nvlStr(ch.getAutoCollectYn(), "N"));
            chart.put("editableYn",      nvlStr(ch.getEditableYn(), "Y"));
            /* 차트마다 필요한 조회조건 차원이 다르다(예: 일별/월별, 상품·업체 필요 여부) — 화면이
               이 값 기준으로 차트를 묶어 그룹별 조회조건을 따로 받는다(2026-08-21) */
            chart.put("inputOpts",       nvlStr(ch.getInputOpts(), DEFAULT_INPUT_OPTS));
            /* 쿼리방식(QUERY) 위젯은 SQL 실행 결과로 값이 채워지므로 데이터관리 화면에서 손으로
               고치는 대상이 아니다 — 참조항목명은 화면에서 안내 문구로 보여준다(2026-08-21) */
            chart.put("widgetGenTypeCd", nvlStr(ch.getWidgetGenTypeCd(), "MANUAL"));
            chart.put("refItemKey",      ch.getRefItemKey());
            chart.put("colNms",          colNms);
            chart.put("colCds",          colCds);
            /* 열 제목은 항상 3레벨(항목) 정의행에서 온다 — 값이 항상 3레벨에만 붙는 지금 구조에서는
               이 화면(데이터관리)에서 직접 고칠 수 없다(항목관리에서만 변경). 화면은 이 값으로
               열 제목을 읽기전용 표시할지(true) 빈 입력칸으로 받을지(false) 를 가른다.
               예전엔 DATE 축일 때만 false 였으나, DATE 축도 이제 항목행을 두므로 항상 true. */
            chart.put("colsFixed",       true);
            chart.put("rows",            rows);
            charts.add(chart);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("charts", charts);
        return out;
    }

    /* ── 저장 ─────────────────────────────────────────────────────────────── */

    /**
     * 그리드 전체 저장. 셀(시리즈 × 항목) 하나마다 값 1행을 upsert 한다.
     *
     * @param charts [{dashboardItemId, rows:[{cellItemIds[], vals[]}]}]
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
        /* period_type_cd 는 data_opts(UNIQUE 키)에 그대로 들어가므로 여기서 잘못 좁히면
           같은 좌표인데 다른 data_opts 로 저장되는 사고가 난다 — D/M/Y 를 그대로 통과시키고
           그 외(공백 등)만 D 로 보정한다 (2026-08-21, 연도별 그룹 지원 추가) */
        String per = ("M".equals(periodTypeCd) || "Y".equals(periodTypeCd)) ? periodTypeCd : "D";

        int saved = 0;
        for (Map<String, Object> chart : charts == null ? List.<Map<String, Object>>of() : charts) {
            String chartId = str(chart.get("dashboardItemId"));
            if (chartId == null) continue;
            CmDashboardItem ch = itemRepository.findById(chartId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 차트입니다: " + chartId));
            /* 자동수집 차트는 배치가 채운다 — 화면에서 직접 저장하지 않는다(방어적 재검증,
               프론트도 입력을 비활성화하지만 서버에서도 한 번 더 막는다) */
            if ("N".equals(nvlStr(ch.getEditableYn(), "Y"))) continue;

            for (Object rowObj : asList(chart.get("rows"))) {
                if (!(rowObj instanceof Map<?, ?> row)) continue;
                List<?> vals = asList(row.get("vals"));
                List<?> cellIds = asList(row.get("cellItemIds"));
                for (int i2 = 0; i2 < cellIds.size() && i2 < vals.size(); i2++) {
                    String leafId = str(cellIds.get(i2));
                    if (leafId == null) continue;
                    Double v = toDouble(vals.get(i2));
                    if (v == null) continue;   /* 빈 셀은 저장하지 않는다 */
                    CmDashboardData e = upsert(leafId, siteId, yyyymmdd, per, pId, vId, ch, authId, now);
                    e.setDataVal(v);
                    dataRepository.save(e);
                    saved++;
                }
            }
        }
        em.flush();
        return saved;
    }

    /**
     * 좌표(정의행 + data_opts)로 기존 행을 찾아 없으면 만든다.
     *
     * <p>{@code (item_key, data_opts)} 가 UNIQUE 이므로 같은 좌표에 두 행이 생기지 않는다 —
     * 다시 저장하면 새 행이 아니라 그 행이 갱신된다.</p>
     */
    private CmDashboardData upsert(String defItemId, String siteId, String yyyymmdd, String per,
                                   String pId, String vId, CmDashboardItem ch,
                                   String authId, LocalDateTime now) {
        CmDashboardData probe = new CmDashboardData();
        probe.setSiteId(siteId);
        probe.setYyyymmdd(yyyymmdd);
        probe.setPeriodTypeCd(per);
        probe.setProdId(pId);
        probe.setVendorId(vId);
        String dataOpts = buildOptions(probe);

        /* item_key = 값이 붙는 3레벨 정의행의 조립코드. (item_key, data_opts) 가 UNIQUE 라 이 둘로 찾는다 */
        CmDashboardItem leaf = itemRepository.findById(defItemId)
            .orElseThrow(() -> new CmBizException("존재하지 않는 정의행입니다: " + defItemId));
        if (!Integer.valueOf(3).equals(leaf.getKeyLevel()))
            throw new CmBizException("값은 3레벨(항목) 정의행에만 저장할 수 있습니다: " + defItemId);
        String itemKey = leaf.getItemKey();

        CmDashboardData e = dataRepository
            .findByItemKeyAndDataOpts(itemKey, dataOpts)
            .orElseGet(() -> {
                CmDashboardData n = new CmDashboardData();
                n.setDashboardDataId(CmUtil.generateId("cm_dashboard_data"));
                n.setRegBy(authId);
                n.setRegDate(now);
                return n;
            });
        e.setDashboardItemId(defItemId);
        e.setDashboardId(ch.getDashboardId());
        e.setDataOpts(dataOpts);
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
     */
    public Map<String, Object> simulate(String dashboardId, String siteId, String yyyymmdd,
                                        String periodTypeCd, String prodId, String vendorId) {
        Map<String, Object> grids = getGrids(dashboardId, siteId, yyyymmdd, prodId, vendorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> charts = (List<Map<String, Object>>) grids.get("charts");

        for (Map<String, Object> chart : charts) {
            String[] colNms = (String[]) chart.get("colNms");
            int colCnt = 0;
            for (String cn : colNms) if (cn != null && !cn.isBlank()) colCnt++;
            if (colCnt == 0) colCnt = MAX_COLS;   /* 열 제목이 아예 없으면 전체 슬롯을 채운다 */

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

    /* ── 조회(위젯 렌더) ──────────────────────────────────────────────────── */

    /**
     * 위젯 렌더용 데이터 — 차트 하나의 시리즈×항목 실데이터를 legacy col1~9 형태로 pivot 해 돌려준다.
     *
     * <p>쿼리는 세 단계로 구성한다.</p>
     * <pre>
     *   1) t01 헤더 : 이 차트의 시리즈(2레벨)·항목(3레벨) 정의행 — cm_dashboard_item
     *   2) t02 데이터: 그 항목들에 실제 붙은 값 — cm_dashboard_data (기간·사이트로 좁힌다)
     *   3) t01,t02 조인: 항목의 열 위치(sort_ord 순번)에 값을 꽂아 시리즈×날짜 단위로 pivot
     * </pre>
     *
     * <p>DATE·CATEGORY 축을 가리지 않는 <b>공통 조회</b>다 — 값이 항상 3레벨에만 붙으므로
     * 차트가 어떤 축이든 "시리즈 아래 항목들이 곧 열" 이라는 구조가 동일하다.</p>
     *
     * @param chartId  차트(1레벨) 정의행 ID
     * @param siteId   사이트ID (null 이면 전체)
     * @param startYmd 시작일 (null 가능)
     * @param endYmd   종료일 (null 가능)
     * @return 시리즈×날짜 단위 pivot 행 목록 — col1Nm/col1Num~col9 에 항목이 sort_ord 순서로 채워진다
     */
    @SuppressWarnings("unchecked")
    public List<CmDashboardWidgetRow> queryWidgetRows(String chartId, String siteId,
                                                       String startYmd, String endYmd) {
        CmDashboardItem ch = itemRepository.findById(chartId).orElse(null);
        if (ch == null) return List.of();

        /* 1) t01 헤더 — 이 차트의 시리즈·항목 정의행 (열 위치는 sort_ord 로 고정) */
        List<CmDashboardItem> desc = descendantsOf(ch);
        Map<String, List<CmDashboardItem>> itemsBySeries = new LinkedHashMap<>();
        for (CmDashboardItem it : desc) {
            if (!Integer.valueOf(3).equals(it.getKeyLevel())) continue;
            itemsBySeries.computeIfAbsent(it.getParentDashboardItemId(), k -> new ArrayList<>()).add(it);
        }
        Comparator<CmDashboardItem> bySort = Comparator.comparing(x -> x.getSortOrd() == null ? 0 : x.getSortOrd());
        itemsBySeries.values().forEach(l -> l.sort(bySort));
        if (itemsBySeries.isEmpty()) return List.of();

        /* CmDashboardWidgetRow 의 계약(Javadoc) — "행 하나 = 카테고리(항목/날짜) 하나,
           col1Nm 이 그 행의 X축 라벨, col1Num~col9Num 이 그 카테고리에서의 시리즈별 값" —
           는 이 메서드의 두 소비처(EC01~03 legacy 대시보드 DashboardBoEc0{1,2,3}.js 의
           cfMonthLabels=dash.infoXXXX.map(r=>r.col1Nm) 패턴, CmDashboardWidgetUtil.buildWidget
           의 rows.map(r=>r.col1Nm) 패턴) 양쪽 모두가 그대로 전제하고 있다 — 즉 행=항목,
           열=시리즈 순번이어야 한다. desc 가 이미 sortOrd 순이라 itemsBySeries 키 순서 그대로
           시리즈 열 순번으로 쓴다. */
        List<String> seriesOrder = new ArrayList<>(itemsBySeries.keySet());
        Map<String, Integer> seriesColOf = new HashMap<>();   /* seriesId -> 1-based 열 순번(시리즈) */
        for (int s = 0; s < seriesOrder.size() && s < MAX_COLS; s++) seriesColOf.put(seriesOrder.get(s), s + 1);

        Map<String, CmDashboardItem> leafByPk = new HashMap<>();
        Map<String, Integer> itemRankOf = new HashMap<>();   /* leafPk -> 1-based 행 순번(시리즈 내 항목 위치) */
        for (List<CmDashboardItem> items : itemsBySeries.values()) {
            for (int i = 0; i < items.size() && i < MAX_COLS; i++) {
                leafByPk.put(items.get(i).getDashboardItemId(), items.get(i));
                itemRankOf.put(items.get(i).getDashboardItemId(), i + 1);
            }
        }
        if (leafByPk.isEmpty()) return List.of();

        /* 2) t02 데이터 — t01 에서 얻은 항목(leaf) PK 목록으로 값만 좁혀 읽는다 */
        List<Object[]> t02 = em.createNativeQuery(
                "WITH t02 AS (" +
                "  SELECT d.dashboard_item_id, d.yyyymmdd, d.data_val" +
                "  FROM shopjoy_2604.cm_dashboard_data d" +
                "  WHERE d.dashboard_item_id IN (:leafIds)" +
                /* PostgreSQL 은 NULL 비교에만 쓰이는 바인드 파라미터의 타입을 추론하지 못한다
                   ("could not determine data type of parameter") — CAST 로 타입을 명시한다 */
                "    AND (CAST(:siteId AS varchar) IS NULL OR d.site_id = :siteId)" +
                "    AND (CAST(:startYmd AS varchar) IS NULL OR d.yyyymmdd >= :startYmd)" +
                "    AND (CAST(:endYmd AS varchar) IS NULL OR d.yyyymmdd <= :endYmd)" +
                ") SELECT dashboard_item_id, yyyymmdd, data_val FROM t02 ORDER BY yyyymmdd")
            .setParameter("leafIds", leafByPk.keySet())
            .setParameter("siteId", siteId)
            .setParameter("startYmd", startYmd)
            .setParameter("endYmd", endYmd)
            .getResultList();

        /* 3) 행 뼈대 먼저 — 항목(행=카테고리) 라벨은 데이터 유무와 무관하게 항상 채운다.
         *
         * ⚠️ 예전엔 값이 있는 t02 행을 순회하며 그때그때 행을 만들었다(key=seriesId+"|"+ymd 또는
         * seriesId 단독) — 그러다 보니 (a) 값이 아예 없는 항목(달)은 행 자체가 안 생겨 라벨도
         * 안 보이고("데이타 없으면 시리즈 표시 안됨" — 사용자 지적), (b) 행/열 방향이 소비처
         * 계약과 어긋나 있었다. 소비처(EC01~03 legacy 대시보드 · CmDashboardWidgetUtil.buildWidget)
         * 는 전부 "행 하나 = 항목(날짜/카테고리) 하나, col1Nm 이 그 행의 라벨, col1~9Num 이 그
         * 항목에서의 시리즈별 값" 을 전제로 rows.map(r=>r.col1Nm) 패턴을 쓴다.
         * 시리즈끼리는 항목 1벌을 공유하므로(syncChildren) 첫 시리즈의 항목명을 행 라벨로 쓰면 된다. */
        Map<Integer, CmDashboardWidgetRow> out = new LinkedHashMap<>();
        List<CmDashboardItem> baseItems = itemsBySeries.values().iterator().next();
        for (int i = 0; i < baseItems.size() && i < MAX_COLS; i++) {
            CmDashboardWidgetRow w = CmDashboardWidgetRow.builder().compId(ch.getItemKey()).build();
            String nm = baseItems.get(i).getItemNm();
            for (int s = 1; s <= seriesColOf.size(); s++) w.setNm(s, nm);   /* 라벨은 데이터 없어도 항상 표시 */
            out.put(i + 1, w);
        }

        /* 4) 값 채우기 — 실제 데이터가 있는 (항목,시리즈) 칸만 덮어쓴다 */
        for (Object[] row : t02) {
            String leafPk = String.valueOf(row[0]);
            CmDashboardItem leaf = leafByPk.get(leafPk);
            if (leaf == null) continue;
            Integer rank = itemRankOf.get(leafPk);
            Integer col  = seriesColOf.get(leaf.getParentDashboardItemId());
            if (rank == null || col == null) continue;
            CmDashboardWidgetRow w = out.get(rank);
            if (w == null) continue;
            String ymd = String.valueOf(row[1]);
            w.setYyyymmdd(ymd);   /* 최신 날짜로 갱신 — 행 대표값일 뿐 컬럼값과는 무관 */
            Double num = row[2] == null ? null : ((Number) row[2]).doubleValue();
            w.setNum(col, num);
        }
        return new ArrayList<>(out.values());
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
    private List<CmDashboardData> findRows(String siteId, String yyyymmdd, List<String> itemIds,
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

    private static List<?> asList(Object o) { return o instanceof List<?> l ? l : List.of(); }
    private static String str(Object o) { return o == null ? null : String.valueOf(o); }
    private static String nvlStr(String s, String def) { return s == null || s.isBlank() ? def : s; }
    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s; }
}
