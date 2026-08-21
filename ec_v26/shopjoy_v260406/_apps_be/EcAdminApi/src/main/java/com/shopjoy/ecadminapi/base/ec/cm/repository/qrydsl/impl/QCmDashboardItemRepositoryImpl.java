package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** CmDashboardItem(대시보드 차트 패널 정의) QueryDSL Custom 구현체 */
@Slf4j
@RequiredArgsConstructor
public class QCmDashboardItemRepositoryImpl implements QCmDashboardItemRepository {

    private final JPAQueryFactory queryFactory;
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
}
