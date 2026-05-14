package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QDpWidgetRepositoryImpl implements QDpWidgetRepository {

    private final JPAQueryFactory queryFactory;
    private static final QDpWidget w = QDpWidget.dpWidget;

    @Override
    public Optional<DpWidgetDto.Item> selectById(String widgetId) {
        return Optional.ofNullable(baseQuery().where(w.widgetId.eq(widgetId)).fetchOne());
    }

    @Override
    public List<DpWidgetDto.Item> selectList(DpWidgetDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public DpWidgetDto.PageResponse selectPageList(DpWidgetDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpWidgetDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(w.count()).from(w).where(where).fetchOne();
        DpWidgetDto.PageResponse res = new DpWidgetDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<DpWidgetDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpWidgetDto.Item.class,
                w.widgetId, w.widgetLibId, w.siteId, w.widgetNm, w.widgetTypeCd,
                w.widgetDesc, w.widgetTitle, w.widgetContent, w.titleShowYn,
                w.widgetLibRefYn, w.widgetConfigJson, w.previewImgUrl,
                w.sortOrd, w.useYn, w.dispEnv,
                w.regBy, w.regDate, w.updBy, w.updDate
        )).from(w);
    }

    private BooleanBuilder buildCondition(DpWidgetDto.Request s) {
        BooleanBuilder w2 = new BooleanBuilder();
        if (s == null) return w2;
        if (StringUtils.hasText(s.getSiteId()))       w2.and(w.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getWidgetId()))     w2.and(w.widgetId.eq(s.getWidgetId()));
        if (StringUtils.hasText(s.getWidgetLibId()))  w2.and(w.widgetLibId.eq(s.getWidgetLibId()));
        if (StringUtils.hasText(s.getWidgetTypeCd())) w2.and(w.widgetTypeCd.eq(s.getWidgetTypeCd()));
        if (StringUtils.hasText(s.getUseYn()))        w2.and(w.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_widget_nm"))    or.or(w.widgetNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_widget_title")) or.or(w.widgetTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w2.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w2.and(w.regDate.goe(start)).and(w.regDate.lt(endExcl)); break;
                case "upd_date": w2.and(w.updDate.goe(start)).and(w.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w2;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpWidgetDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, w.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("widgetId".equals(field)) {
                    orders.add(new OrderSpecifier(order, w.widgetId));
                } else if ("widgetNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, w.widgetNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, w.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(DpWidget entity) {
        if (entity.getWidgetId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(w);
        boolean hasAny = false;
        if (entity.getWidgetLibId()      != null) { update.set(w.widgetLibId,      entity.getWidgetLibId());      hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(w.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getWidgetNm()         != null) { update.set(w.widgetNm,         entity.getWidgetNm());         hasAny = true; }
        if (entity.getWidgetTypeCd()     != null) { update.set(w.widgetTypeCd,     entity.getWidgetTypeCd());     hasAny = true; }
        if (entity.getWidgetDesc()       != null) { update.set(w.widgetDesc,       entity.getWidgetDesc());       hasAny = true; }
        if (entity.getWidgetTitle()      != null) { update.set(w.widgetTitle,      entity.getWidgetTitle());      hasAny = true; }
        if (entity.getWidgetContent()    != null) { update.set(w.widgetContent,    entity.getWidgetContent());    hasAny = true; }
        if (entity.getTitleShowYn()      != null) { update.set(w.titleShowYn,      entity.getTitleShowYn());      hasAny = true; }
        if (entity.getWidgetLibRefYn()   != null) { update.set(w.widgetLibRefYn,   entity.getWidgetLibRefYn());   hasAny = true; }
        if (entity.getWidgetConfigJson() != null) { update.set(w.widgetConfigJson, entity.getWidgetConfigJson()); hasAny = true; }
        if (entity.getPreviewImgUrl()    != null) { update.set(w.previewImgUrl,    entity.getPreviewImgUrl());    hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(w.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(w.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getDispEnv()          != null) { update.set(w.dispEnv,          entity.getDispEnv());          hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(w.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(w.updDate,          entity.getUpdDate());          hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(w.widgetId.eq(entity.getWidgetId())).execute();
    }
}
