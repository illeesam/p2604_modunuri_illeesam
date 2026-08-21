package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

/** CmDashboardItem(대시보드 차트 패널 정의) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmDashboardItemRepositoryImpl implements QCmDashboardItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmDashboardItem cmDashboardItem = QCmDashboardItem.cmDashboardItem;

    /* 대시보드 패널 정의 부분수정 — 넘어온 필드만 SET, 나머지 컬럼은 건드리지 않는다 */
    @Override
    public int updateSelective(CmDashboardItem entity) {
        if (entity.getDashboardItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmDashboardItem);
        boolean hasAny = false;

        if (entity.getDashboardId() != null)         { update.set(cmDashboardItem.dashboardId,            entity.getDashboardId());             hasAny = true; }
        if (entity.getItemKey() != null)             { update.set(cmDashboardItem.itemKey,                entity.getItemKey());                 hasAny = true; }
        if (entity.getItemNm() != null)              { update.set(cmDashboardItem.itemNm,                 entity.getItemNm());                  hasAny = true; }
        if (entity.getItemTypeCd() != null)          { update.set(cmDashboardItem.itemTypeCd,             entity.getItemTypeCd());              hasAny = true; }
        if (entity.getKeyLevel() != null)            { update.set(cmDashboardItem.keyLevel,               entity.getKeyLevel());                hasAny = true; }
        if (entity.getKeyNm() != null)                { update.set(cmDashboardItem.keyNm,                  entity.getKeyNm());                   hasAny = true; }
        if (entity.getParentDashboardItemId() != null) { update.set(cmDashboardItem.parentDashboardItemId, entity.getParentDashboardItemId());  hasAny = true; }
        if (entity.getWidgetTypeCd() != null)        { update.set(cmDashboardItem.widgetTypeCd,           entity.getWidgetTypeCd());            hasAny = true; }
        if (entity.getAxisTypeCd() != null)          { update.set(cmDashboardItem.axisTypeCd,             entity.getAxisTypeCd());               hasAny = true; }
        if (entity.getChartTypeCd() != null)         { update.set(cmDashboardItem.chartTypeCd,            entity.getChartTypeCd());              hasAny = true; }
        if (entity.getSeriesOrientCd() != null)      { update.set(cmDashboardItem.seriesOrientCd,         entity.getSeriesOrientCd());           hasAny = true; }
        if (entity.getItemColor() != null)           { update.set(cmDashboardItem.itemColor,              entity.getItemColor());                hasAny = true; }
        if (entity.getLvl1CodeGrp() != null)         { update.set(cmDashboardItem.lvl1CodeGrp,            entity.getLvl1CodeGrp());              hasAny = true; }
        if (entity.getLvl2CodeGrp() != null)         { update.set(cmDashboardItem.lvl2CodeGrp,            entity.getLvl2CodeGrp());              hasAny = true; }
        if (entity.getDataSourceCd() != null)        { update.set(cmDashboardItem.dataSourceCd,           entity.getDataSourceCd());             hasAny = true; }
        if (entity.getAutoCollectYn() != null)       { update.set(cmDashboardItem.autoCollectYn,          entity.getAutoCollectYn());            hasAny = true; }
        if (entity.getEditableYn() != null)          { update.set(cmDashboardItem.editableYn,             entity.getEditableYn());               hasAny = true; }
        if (entity.getInputOpts() != null)           { update.set(cmDashboardItem.inputOpts,              entity.getInputOpts());                hasAny = true; }
        if (entity.getSortOrd() != null)             { update.set(cmDashboardItem.sortOrd,                entity.getSortOrd());                  hasAny = true; }
        if (entity.getUseYn() != null)               { update.set(cmDashboardItem.useYn,                  entity.getUseYn());                    hasAny = true; }
        if (entity.getOptionJson() != null)          { update.set(cmDashboardItem.optionJson,             entity.getOptionJson());               hasAny = true; }
        if (entity.getSimJson() != null)             { update.set(cmDashboardItem.simJson,                entity.getSimJson());                  hasAny = true; }
        if (entity.getRealtimeYn() != null)          { update.set(cmDashboardItem.realtimeYn,             entity.getRealtimeYn());               hasAny = true; }
        if (entity.getRealtimeJson() != null)        { update.set(cmDashboardItem.realtimeJson,           entity.getRealtimeJson());             hasAny = true; }
        if (entity.getGridColStart() != null)        { update.set(cmDashboardItem.gridColStart,           entity.getGridColStart());             hasAny = true; }
        if (entity.getGridColEnd() != null)          { update.set(cmDashboardItem.gridColEnd,             entity.getGridColEnd());                hasAny = true; }
        if (entity.getGridRowStart() != null)        { update.set(cmDashboardItem.gridRowStart,           entity.getGridRowStart());             hasAny = true; }
        if (entity.getGridRowEnd() != null)          { update.set(cmDashboardItem.gridRowEnd,             entity.getGridRowEnd());                hasAny = true; }
        if (entity.getPanelWidth() != null)          { update.set(cmDashboardItem.panelWidth,             entity.getPanelWidth());               hasAny = true; }
        if (entity.getPanelHeight() != null)         { update.set(cmDashboardItem.panelHeight,            entity.getPanelHeight());              hasAny = true; }
        if (entity.getUpdBy() != null)               { update.set(cmDashboardItem.updBy,                  entity.getUpdBy());                    hasAny = true; }
        update.set(cmDashboardItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmDashboardItem.dashboardItemId.eq(entity.getDashboardItemId())).execute();
        return (int) affected;
    }
}
