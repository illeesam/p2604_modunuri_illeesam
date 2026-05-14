package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QDpPanelItemRepositoryImpl implements QDpPanelItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QDpPanelItem i = QDpPanelItem.dpPanelItem;

    @Override
    public Optional<DpPanelItemDto.Item> selectById(String panelItemId) {
        return Optional.ofNullable(baseQuery().where(i.panelItemId.eq(panelItemId)).fetchOne());
    }

    @Override
    public List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public DpPanelItemDto.PageResponse selectPageList(DpPanelItemDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpPanelItemDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();
        DpPanelItemDto.PageResponse res = new DpPanelItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<DpPanelItemDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpPanelItemDto.Item.class,
                i.panelItemId, i.panelId, i.widgetLibId, i.widgetTypeCd,
                i.widgetTitle, i.widgetContent, i.titleShowYn, i.widgetLibRefYn,
                i.contentTypeCd, i.itemSortOrd, i.widgetConfigJson,
                i.visibilityTargets, i.dispYn, i.dispStartDate, i.dispEndDate,
                i.dispEnv, i.useYn,
                i.regBy, i.regDate, i.updBy, i.updDate
        )).from(i);
    }

    private BooleanBuilder buildCondition(DpPanelItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getPanelItemId()))  w.and(i.panelItemId.eq(s.getPanelItemId()));
        if (StringUtils.hasText(s.getWidgetTypeCd())) w.and(i.widgetTypeCd.eq(s.getWidgetTypeCd()));
        if (StringUtils.hasText(s.getWidgetLibId()))  w.and(i.widgetLibId.eq(s.getWidgetLibId()));
        if (StringUtils.hasText(s.getPanelId()))      w.and(i.panelId.eq(s.getPanelId()));
        if (StringUtils.hasText(s.getUseYn()))        w.and(i.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_widget_title")) or.or(i.widgetTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl)); break;
                case "upd_date": w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpPanelItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) { orders.add(new OrderSpecifier(Order.DESC, i.regDate)); return orders; }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.panelItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.panelItemId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.widgetTitle)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, i.widgetTitle)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(DpPanelItem entity) {
        if (entity.getPanelItemId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;
        if (entity.getPanelId()           != null) { update.set(i.panelId,           entity.getPanelId());           hasAny = true; }
        if (entity.getWidgetLibId()       != null) { update.set(i.widgetLibId,       entity.getWidgetLibId());       hasAny = true; }
        if (entity.getWidgetTypeCd()      != null) { update.set(i.widgetTypeCd,      entity.getWidgetTypeCd());      hasAny = true; }
        if (entity.getWidgetTitle()       != null) { update.set(i.widgetTitle,       entity.getWidgetTitle());       hasAny = true; }
        if (entity.getWidgetContent()     != null) { update.set(i.widgetContent,     entity.getWidgetContent());     hasAny = true; }
        if (entity.getTitleShowYn()       != null) { update.set(i.titleShowYn,       entity.getTitleShowYn());       hasAny = true; }
        if (entity.getWidgetLibRefYn()    != null) { update.set(i.widgetLibRefYn,    entity.getWidgetLibRefYn());    hasAny = true; }
        if (entity.getContentTypeCd()     != null) { update.set(i.contentTypeCd,     entity.getContentTypeCd());     hasAny = true; }
        if (entity.getItemSortOrd()       != null) { update.set(i.itemSortOrd,       entity.getItemSortOrd());       hasAny = true; }
        if (entity.getWidgetConfigJson()  != null) { update.set(i.widgetConfigJson,  entity.getWidgetConfigJson());  hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(i.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(i.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDate()     != null) { update.set(i.dispStartDate,     entity.getDispStartDate());     hasAny = true; }
        if (entity.getDispEndDate()       != null) { update.set(i.dispEndDate,       entity.getDispEndDate());       hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(i.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(i.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(i.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(i.updDate,           entity.getUpdDate());           hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(i.panelItemId.eq(entity.getPanelItemId())).execute();
    }
}
