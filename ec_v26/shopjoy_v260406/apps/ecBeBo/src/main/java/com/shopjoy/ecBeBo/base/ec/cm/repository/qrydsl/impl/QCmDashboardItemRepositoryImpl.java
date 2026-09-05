package com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.QCmDashboardItem;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository;
import com.shopjoy.ecBeBo.common.data.BasePage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** CmDashboardItem(대시보드 차트 패널 정의) QueryDSL Custom 구현체 */
@Slf4j
@RequiredArgsConstructor
public class QCmDashboardItemRepositoryImpl implements QCmDashboardItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmDashboardItemRepositoryImpl";
    private static final QCmDashboardItem cmDashboardItem = QCmDashboardItem.cmDashboardItem;

    /**
     * 대시보드 패널 정의 부분수정 — 넘어온 필드만 SET, 나머지 컬럼은 건드리지 않는다.
     *
     * <p>⚠️ p6spy 로그에서 이 UPDATE 의 SQL 텍스트가 잘못 보일 수 있다 — SET 절의 첫 번째
     * 컬럼이 실제로는 정상 값이 바인딩됨에도 로그에 리터럴 {@code NULL} 로, 나머지는 미해석
     * {@code ?} 로 찍히는 현상을 확인했다(2026-08-21). DB 를 직접 조회해 실값이 정확히
     * 저장됨을 두 번 검증 완료 — Hibernate 6 의 벌크 UPDATE HQL 코멘트/SQL 렌더링 쪽 문제로
     * 보이며 우리 코드·데이터에는 영향이 없다. 로그로 실제 SET 값을 확인하려면 p6spy 가 아니라
     * 아래 {@code log.info} 한 줄을 본다(항상 정확한 값을 남김).</p>
     */
    @Override
    public int updateSelective(CmDashboardItem entity) {
        if (entity.getDashboardItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmDashboardItem);
        Map<String, Object> changed = new LinkedHashMap<>();

        if (entity.getDashboardId() != null)         { update.set(cmDashboardItem.dashboardId,            entity.getDashboardId());             changed.put("dashboardId", entity.getDashboardId()); }
        if (entity.getItemKey() != null)             { update.set(cmDashboardItem.itemKey,                entity.getItemKey());                 changed.put("itemKey", entity.getItemKey()); }
        if (entity.getItemNm() != null)              { update.set(cmDashboardItem.itemNm,                 entity.getItemNm());                  changed.put("itemNm", entity.getItemNm()); }
        if (entity.getItemTypeCd() != null)          { update.set(cmDashboardItem.itemTypeCd,             entity.getItemTypeCd());              changed.put("itemTypeCd", entity.getItemTypeCd()); }
        if (entity.getKeyLevel() != null)            { update.set(cmDashboardItem.keyLevel,               entity.getKeyLevel());                changed.put("keyLevel", entity.getKeyLevel()); }
        if (entity.getKeyNm() != null)                { update.set(cmDashboardItem.keyNm,                  entity.getKeyNm());                   changed.put("keyNm", entity.getKeyNm()); }
        if (entity.getParentDashboardItemId() != null) { update.set(cmDashboardItem.parentDashboardItemId, entity.getParentDashboardItemId());  changed.put("parentDashboardItemId", entity.getParentDashboardItemId()); }
        if (entity.getWidgetTypeCd() != null)        { update.set(cmDashboardItem.widgetTypeCd,           entity.getWidgetTypeCd());            changed.put("widgetTypeCd", entity.getWidgetTypeCd()); }
        if (entity.getAxisTypeCd() != null)          { update.set(cmDashboardItem.axisTypeCd,             entity.getAxisTypeCd());               changed.put("axisTypeCd", entity.getAxisTypeCd()); }
        if (entity.getChartTypeCd() != null)         { update.set(cmDashboardItem.chartTypeCd,            entity.getChartTypeCd());              changed.put("chartTypeCd", entity.getChartTypeCd()); }
        if (entity.getSeriesOrientCd() != null)      { update.set(cmDashboardItem.seriesOrientCd,         entity.getSeriesOrientCd());           changed.put("seriesOrientCd", entity.getSeriesOrientCd()); }
        if (entity.getLvl2Color() != null)           { update.set(cmDashboardItem.lvl2Color,              entity.getLvl2Color());                changed.put("lvl2Color", entity.getLvl2Color()); }
        if (entity.getLvl3Color() != null)           { update.set(cmDashboardItem.lvl3Color,              entity.getLvl3Color());                changed.put("lvl3Color", entity.getLvl3Color()); }
        if (entity.getLvl2PaletteCd() != null)       { update.set(cmDashboardItem.lvl2PaletteCd,          entity.getLvl2PaletteCd());            changed.put("lvl2PaletteCd", entity.getLvl2PaletteCd()); }
        if (entity.getLvl3PaletteCd() != null)       { update.set(cmDashboardItem.lvl3PaletteCd,          entity.getLvl3PaletteCd());            changed.put("lvl3PaletteCd", entity.getLvl3PaletteCd()); }
        if (entity.getWidgetGenTypeCd() != null)     { update.set(cmDashboardItem.widgetGenTypeCd,        entity.getWidgetGenTypeCd());          changed.put("widgetGenTypeCd", entity.getWidgetGenTypeCd()); }
        if (entity.getGenQuery() != null)            { update.set(cmDashboardItem.genQuery,               entity.getGenQuery());                 changed.put("genQuery", entity.getGenQuery()); }
        if (entity.getRefItemKey() != null)          { update.set(cmDashboardItem.refItemKey,             entity.getRefItemKey());               changed.put("refItemKey", entity.getRefItemKey()); }
        if (entity.getLvl1CodeGrp() != null)         { update.set(cmDashboardItem.lvl1CodeGrp,            entity.getLvl1CodeGrp());              changed.put("lvl1CodeGrp", entity.getLvl1CodeGrp()); }
        if (entity.getLvl2CodeGrp() != null)         { update.set(cmDashboardItem.lvl2CodeGrp,            entity.getLvl2CodeGrp());              changed.put("lvl2CodeGrp", entity.getLvl2CodeGrp()); }
        if (entity.getDataSourceCd() != null)        { update.set(cmDashboardItem.dataSourceCd,           entity.getDataSourceCd());             changed.put("dataSourceCd", entity.getDataSourceCd()); }
        if (entity.getAutoCollectYn() != null)       { update.set(cmDashboardItem.autoCollectYn,          entity.getAutoCollectYn());            changed.put("autoCollectYn", entity.getAutoCollectYn()); }
        if (entity.getEditableYn() != null)          { update.set(cmDashboardItem.editableYn,             entity.getEditableYn());               changed.put("editableYn", entity.getEditableYn()); }
        if (entity.getInputOpts() != null)           { update.set(cmDashboardItem.inputOpts,              entity.getInputOpts());                changed.put("inputOpts", entity.getInputOpts()); }
        if (entity.getSortOrd() != null)             { update.set(cmDashboardItem.sortOrd,                entity.getSortOrd());                  changed.put("sortOrd", entity.getSortOrd()); }
        if (entity.getUseYn() != null)               { update.set(cmDashboardItem.useYn,                  entity.getUseYn());                    changed.put("useYn", entity.getUseYn()); }
        if (entity.getOptionJson() != null)          { update.set(cmDashboardItem.optionJson,             entity.getOptionJson());               changed.put("optionJson", entity.getOptionJson()); }
        if (entity.getSimJson() != null)             { update.set(cmDashboardItem.simJson,                entity.getSimJson());                  changed.put("simJson", entity.getSimJson()); }
        if (entity.getRealtimeYn() != null)          { update.set(cmDashboardItem.realtimeYn,             entity.getRealtimeYn());               changed.put("realtimeYn", entity.getRealtimeYn()); }
        if (entity.getRealtimeJson() != null)        { update.set(cmDashboardItem.realtimeJson,           entity.getRealtimeJson());             changed.put("realtimeJson", entity.getRealtimeJson()); }
        if (entity.getGridColStart() != null)        { update.set(cmDashboardItem.gridColStart,           entity.getGridColStart());             changed.put("gridColStart", entity.getGridColStart()); }
        if (entity.getGridColEnd() != null)          { update.set(cmDashboardItem.gridColEnd,             entity.getGridColEnd());                changed.put("gridColEnd", entity.getGridColEnd()); }
        if (entity.getGridRowStart() != null)        { update.set(cmDashboardItem.gridRowStart,           entity.getGridRowStart());             changed.put("gridRowStart", entity.getGridRowStart()); }
        if (entity.getGridRowEnd() != null)          { update.set(cmDashboardItem.gridRowEnd,             entity.getGridRowEnd());                changed.put("gridRowEnd", entity.getGridRowEnd()); }
        if (entity.getPanelWidth() != null)          { update.set(cmDashboardItem.panelWidth,             entity.getPanelWidth());               changed.put("panelWidth", entity.getPanelWidth()); }
        if (entity.getPanelHeight() != null)         { update.set(cmDashboardItem.panelHeight,            entity.getPanelHeight());              changed.put("panelHeight", entity.getPanelHeight()); }
        if (entity.getUpdBy() != null)               { update.set(cmDashboardItem.updBy,                  entity.getUpdBy());                    changed.put("updBy", entity.getUpdBy()); }

        LocalDateTime updDate = LocalDateTime.now();
        update.set(cmDashboardItem.updDate, updDate);
        changed.put("updDate", updDate);

        if (changed.size() <= 1) return 0;   // updDate 뿐이면 실질 변경 없음

        log.info("[QCmDashboardItemRepositoryImpl.updateSelective] dashboardItemId={} :: SET {}",
                entity.getDashboardItemId(), changed);

        long affected = update.where(cmDashboardItem.dashboardItemId.eq(entity.getDashboardItemId())).execute();
        return (int) affected;
    }

    /** 단건 조회 — hibernate.comment 힌트가 붙는 QueryDSL 진입점 */
    @Override
    public Optional<CmDashboardItem> selectById(String dashboardItemId) {
        if (dashboardItemId == null) return Optional.empty();
        CmDashboardItem row = queryFactory.selectFrom(cmDashboardItem)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
            .where(cmDashboardItem.dashboardItemId.eq(dashboardItemId))
            .fetchOne();
        return Optional.ofNullable(row);
    }


    /**
     * 조건 목록 조회 — dashboardId(단일) / useYn / parentDashboardItemId(단일) /
     * parentDashboardItemIds(목록) 을 옵션으로 조합한다. 아무 것도 없으면 전체. sortOrd 오름차순.
     */
    @Override
    @SuppressWarnings("unchecked")
    public List<CmDashboardItem> selectList(Map<String, Object> p) {
        String dashboardId = (String) p.get("dashboardId");
        String useYn = (String) p.get("useYn");
        String parentDashboardItemId = (String) p.get("parentDashboardItemId");
        List<String> parentDashboardItemIds = (List<String>) p.get("parentDashboardItemIds");

        return queryFactory.selectFrom(cmDashboardItem)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
            .where(
                dashboardId != null && !dashboardId.isBlank() ? cmDashboardItem.dashboardId.eq(dashboardId) : null,
                useYn != null && !useYn.isBlank() ? cmDashboardItem.useYn.eq(useYn) : null,
                parentDashboardItemId != null && !parentDashboardItemId.isBlank() ? cmDashboardItem.parentDashboardItemId.eq(parentDashboardItemId) : null,
                parentDashboardItemIds != null && !parentDashboardItemIds.isEmpty() ? cmDashboardItem.parentDashboardItemId.in(parentDashboardItemIds) : null
            )
            .orderBy(cmDashboardItem.sortOrd.asc())
            .fetch();
    }

    /**
     * 차트(keyLevel=1) 서버사이드 페이징 조회.
     *
     * <p>itemNm 검색은 차트 자신의 이름뿐 아니라 그 아래 시리즈·항목까지 대상으로 한다 —
     * item1_key 컬럼(2026-08-26 신설, item_key 의 첫 "-" 조각)이 자기 itemKey 와 같은 행이면
     * 자손이라는 뜻이라, 이름이 일치하는 게 하나라도 있으면 그 차트를 포함시킨다(상관 서브쿼리
     * EXISTS). 시리즈·항목을 굳이 join 해 오지 않아도 되어 쿼리가 단순하다.</p>
     */
    @Override
    public BasePage<CmDashboardItem> selectPageData(Map<String, Object> p) {
        int pageNo = parseInt(p.get("pageNo"), 1);
        int pageSize = parseInt(p.get("pageSize"), 30);
        int offset = (pageNo - 1) * pageSize;

        String dashboardId    = (String) p.get("dashboardId");
        String dashboardIdsCsv = (String) p.get("dashboardIds");
        String useYn          = (String) p.get("useYn");
        String itemNm         = (String) p.get("itemNm");

        BooleanBuilder cond = new BooleanBuilder();
        cond.and(cmDashboardItem.keyLevel.eq(1));
        if (dashboardId != null && !dashboardId.isBlank()) {
            cond.and(cmDashboardItem.dashboardId.eq(dashboardId));
        } else if (dashboardIdsCsv != null && !dashboardIdsCsv.isBlank()) {
            List<String> ids = Arrays.stream(dashboardIdsCsv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
            if (!ids.isEmpty()) cond.and(cmDashboardItem.dashboardId.in(ids));
        }
        if (useYn != null && !useYn.isBlank()) {
            cond.and(cmDashboardItem.useYn.eq(useYn));
        }
        if (itemNm != null && !itemNm.isBlank()) {
            /* 여기 cmDashboardItem 은 항상 keyLevel=1(차트) 행이라 itemKey 자체가 곧 item1Key다
               (chart091 같은 단일 조각) — 그래서 자손 판정이 item1_key 컬럼(2026-08-26 신설) 값과
               단순 동등비교로 끝난다. 예전엔 descendant.itemKey LIKE cmDashboardItem.itemKey || '-%'
               로 문자열 접두어 매칭을 했는데, 같은 값을 이미 쪼개 담아둔 컬럼이 있으니 그걸 직접
               비교하는 게 더 명확하고 item1_key 인덱스를 그대로 탄다. keyLevel.ne(1) 은 차트 자기
               자신은 "자손"이 아니므로 제외하는 것 — 어차피 자기 이름은 첫 번째 OR 절이 이미
               검사하므로 없어도 결과는 같지만(중복될 뿐), 의도를 명확히 하려고 남겨둔다. */
            QCmDashboardItem descendant = new QCmDashboardItem("descendant");
            cond.and(cmDashboardItem.itemNm.containsIgnoreCase(itemNm)
                .or(JPAExpressions.selectOne().from(descendant)
                    .where(descendant.item1Key.eq(cmDashboardItem.itemKey)
                        .and(descendant.keyLevel.ne(1))
                        .and(descendant.itemNm.containsIgnoreCase(itemNm)))
                    .exists()));
        }

        JPAQuery<CmDashboardItem> baseQuery = queryFactory.selectFrom(cmDashboardItem).where(cond);

        List<CmDashboardItem> pageList = baseQuery.clone()
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
            .orderBy(cmDashboardItem.dashboardId.asc(), cmDashboardItem.sortOrd.asc(), cmDashboardItem.dashboardItemId.asc())
            .offset(offset).limit(pageSize)
            .fetch();

        Long total = baseQuery.clone()
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
            .select(cmDashboardItem.count())
            .fetchOne();

        BasePage<CmDashboardItem> res = new BasePage<>();
        return res.setPageInfo(pageList, total == null ? 0 : total, pageNo, pageSize, null);
    }

    private static int parseInt(Object v, int def) {
        if (v == null) return def;
        try { return Integer.parseInt(String.valueOf(v).trim()); } catch (Exception e) { return def; }
    }
}
